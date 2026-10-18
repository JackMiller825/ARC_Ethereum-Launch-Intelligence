import { getAddress, isAddress, type PublicClient } from 'viem';
import { formatToken, sameAddr } from '../format';
import type { AnalysisResult, AuditEvent, CoverageItem, PoolInfo, ProgressUpdate, Trade, WindowSpec } from '../types';
import { CHAIN_ID, TOPIC, WETH } from './constants';
import { createChainClient, mapLimit, resolveRpcUrls, throwIfAborted } from './client';
import { decodeLiquidity, decodeSwap, type RawSwap } from './decode';
import { discoverPools } from './discover';
import { blankTrade, poolWethOutflow, reconcileTransaction, type TxMeta } from './economics';
import { coverageScore } from '../analytics/coverage';
import { classifyTrades, HEURISTIC_VERSION } from './heuristics';
import { computeKpis } from './kpis';
import { fetchLogs, findEarliestLog, type ChainLog } from './logs';
import { readBlockscoutProfile, readErc20, tokenRecord } from './metadata';
import { finalizedStatus } from './reorg';

const SEARCH_CAP = 60_000n;

type Options = {
  address: string;
  window: WindowSpec;
  rpcUrls?: string[];
  blockscoutBase?: string;
  projectWallets?: string[];
  independentWallets?: string[];
  priorLaunches?: Record<string, string[]>;
  onProgress?: (update: ProgressUpdate) => void;
  signal?: AbortSignal;
};

export async function analyzeToken(options: Options): Promise<AnalysisResult> {
  const progress = (stage: string, detail: string, pct: number, extra: Partial<ProgressUpdate> = {}) => options.onProgress?.({ stage, detail, pct, ...extra });
  if (!isAddress(options.address)) {
    return { ok: false, origin: 'unavailable', address: options.address, reason: 'Enter a valid 0x-prefixed Ethereum address.', warnings: [] };
  }
  const address = getAddress(options.address);
  const urls = resolveRpcUrls(options.rpcUrls);
  const blockscout = options.blockscoutBase || process.env.BLOCKSCOUT_BASE_URL || 'https://eth.blockscout.com';
  const warnings: string[] = [];
  try {
    progress('RPC', 'Connecting to Ethereum mainnet', 6);
    const { client, head } = await pickClient(urls);
    throwIfAborted(options.signal);
    progress('Metadata', 'Reading ERC-20 name, symbol and decimals', 14);
    const onchain = await readErc20(client, address);
    const profile = await readBlockscoutProfile(blockscout, address, options.signal).catch(() => null);
    if (!profile) warnings.push('Blockscout did not return a contract profile. Deployer and holder count may be blank. Swap decoding does not depend on it.');
    const token = tokenRecord(onchain, profile);
    const headBlock = await client.getBlock({ blockNumber: head });
    const headNumber = Number(head);
    const deployBlock = profile?.deployBlock ? BigInt(profile.deployBlock) : head - 200_000n;
    if (!profile?.deployBlock) warnings.push('Contract creation block was not found. Pool discovery started 200,000 blocks back from the chain tip instead of the deploy block.');

    progress('Pools', 'Resolving Uniswap V2, V3 and V4 pools', 28);
    const discovered = await discoverPools({ client, token: address, urls, fromBlock: deployBlock, toBlock: head, blockscoutBase: blockscout, signal: options.signal });
    warnings.push(...discovered.warnings);
    if (!discovered.pools.length) {
      return { ok: false, origin: 'unavailable', address, reason: 'No supported Uniswap V2, V3 or V4 pool was verified for this contract. Nothing was estimated.', warnings };
    }

    progress('T0', 'Searching for the first public swap after liquidity', 42);
    const blockCache = new Map<number, { timestamp: number; hash: string }>();
    const remember = async (blockNumber: number) => {
      const cached = blockCache.get(blockNumber);
      if (cached) return cached;
      const block = await client.getBlock({ blockNumber: BigInt(blockNumber) });
      const value = { timestamp: Number(block.timestamp), hash: block.hash || '' };
      blockCache.set(blockNumber, value);
      return value;
    };
    const searchTo = deployBlock + SEARCH_CAP < head ? deployBlock + SEARCH_CAP : head;
    const mintTxs = new Set<string>();
    let earliestMint: { blockNumber: number; txHash: string; logIndex: number; amount0: bigint; amount1: bigint; pool: PoolInfo } | null = null;
    let t0Log: { blockNumber: number; txHash: string; logIndex: number; timestamp: number } | null = null;
    for (const pool of discovered.pools) {
      throwIfAborted(options.signal);
      const mintTopic = pool.protocol === 'v2' ? TOPIC.mintV2 : pool.protocol === 'v3' ? TOPIC.mintV3 : TOPIC.modifyV4;
      const swapTopic = pool.protocol === 'v2' ? TOPIC.swapV2 : pool.protocol === 'v3' ? TOPIC.swapV3 : TOPIC.swapV4;
      const mint = await findEarliestLog({ urls, address: pool.address as `0x${string}`, topic0: mintTopic, topic1: pool.poolId as `0x${string}` | undefined, fromBlock: deployBlock, toBlock: searchTo, blockscoutBase: blockscout, signal: options.signal });
      if (mint.log) {
        const decoded = decodeLiquidity(mint.log, pool);
        mintTxs.add(mint.log.transactionHash.toLowerCase());
        if (decoded && (!earliestMint || mint.log.blockNumber < earliestMint.blockNumber || (mint.log.blockNumber === earliestMint.blockNumber && mint.log.logIndex < earliestMint.logIndex))) {
          earliestMint = { blockNumber: mint.log.blockNumber, txHash: mint.log.transactionHash, logIndex: mint.log.logIndex, amount0: decoded.amount0, amount1: decoded.amount1, pool };
        }
      }
      const swap = await findEarliestLog({ urls, address: pool.address as `0x${string}`, topic0: swapTopic, topic1: pool.poolId as `0x${string}` | undefined, fromBlock: deployBlock, toBlock: searchTo, blockscoutBase: blockscout, signal: options.signal });
      let candidate = swap.log;
      if (candidate && mintTxs.has(candidate.transactionHash.toLowerCase())) {
        const follow = await fetchLogs({ urls, address: pool.address as `0x${string}`, topic0: swapTopic, topic1: pool.poolId as `0x${string}` | undefined, fromBlock: BigInt(candidate.blockNumber), toBlock: BigInt(candidate.blockNumber) + 2000n, blockscoutBase: blockscout, signal: options.signal });
        candidate = follow.logs.find((log) => !mintTxs.has(log.transactionHash.toLowerCase())) || null;
      }
      if (!candidate) continue;
      const stamp = await remember(candidate.blockNumber);
      if (!t0Log || candidate.blockNumber < t0Log.blockNumber || (candidate.blockNumber === t0Log.blockNumber && candidate.logIndex < t0Log.logIndex)) {
        t0Log = { blockNumber: candidate.blockNumber, txHash: candidate.transactionHash, logIndex: candidate.logIndex, timestamp: stamp.timestamp };
      }
    }
    if (options.window.mode === 'launch' && !t0Log) {
      return { ok: false, origin: 'unavailable', address, reason: `No independent swap was found in the ${SEARCH_CAP} blocks searched after deployment. Extend the worker backfill or confirm this token has a supported pool. No volume was estimated.`, warnings };
    }

    const headTs = Number(headBlock.timestamp);
    let startTs = headTs - options.window.minutes * 60;
    let endTs = headTs;
    if (options.window.mode === 'launch' && t0Log) {
      startTs = t0Log.timestamp;
      endTs = t0Log.timestamp + options.window.minutes * 60;
    }
    if (options.window.mode === 'absolute') {
      startTs = Math.floor(Date.parse(options.window.startIso) / 1000);
      endTs = Math.floor(Date.parse(options.window.endIso) / 1000);
    }
    progress('Window', 'Mapping the selected interval onto blocks', 52);
    const startBlock = options.window.mode === 'launch' && t0Log ? BigInt(t0Log.blockNumber) : await blockAtTimestamp(client, startTs, deployBlock, head);
    const endBlock = endTs >= headTs ? head : await blockAtTimestamp(client, endTs, startBlock, head);
    const sources = new Set<string>();
    const swapLogs: { log: ChainLog; pool: PoolInfo }[] = [];
    const audits: AuditEvent[] = [];
    const targetBlocks = Number(endBlock - startBlock);
    progress('Swaps', `Reading swap logs from ${startBlock} to ${endBlock}`, 64, { targetBlocks, blocksScanned: 0, pools: discovered.pools.length, swaps: 0 });
    for (const pool of discovered.pools) {
      throwIfAborted(options.signal);
      const swapTopic = pool.protocol === 'v2' ? TOPIC.swapV2 : pool.protocol === 'v3' ? TOPIC.swapV3 : TOPIC.swapV4;
      const mintTopic = pool.protocol === 'v2' ? TOPIC.mintV2 : pool.protocol === 'v3' ? TOPIC.mintV3 : TOPIC.modifyV4;
      const burnTopic = pool.protocol === 'v2' ? TOPIC.burnV2 : pool.protocol === 'v3' ? TOPIC.burnV3 : TOPIC.modifyV4;
      const swaps = await fetchLogs({ urls, address: pool.address as `0x${string}`, topic0: swapTopic, topic1: pool.poolId as `0x${string}` | undefined, fromBlock: startBlock, toBlock: endBlock, blockscoutBase: blockscout, signal: options.signal });
      sources.add(swaps.source);
      swaps.logs.forEach((log) => swapLogs.push({ log, pool }));
      for (const topic0 of [mintTopic, burnTopic]) {
        const liquidity = await fetchLogs({ urls, address: pool.address as `0x${string}`, topic0, topic1: pool.poolId as `0x${string}` | undefined, fromBlock: startBlock, toBlock: endBlock, blockscoutBase: blockscout, signal: options.signal });
        sources.add(liquidity.source);
        for (const log of liquidity.logs) {
          const decoded = decodeLiquidity(log, pool);
          if (!decoded) continue;
          if (decoded.kind === 'mint') {
            mintTxs.add(log.transactionHash.toLowerCase());
            if (!earliestMint || log.blockNumber < earliestMint.blockNumber || (log.blockNumber === earliestMint.blockNumber && log.logIndex < earliestMint.logIndex)) {
              earliestMint = { blockNumber: log.blockNumber, txHash: log.transactionHash, logIndex: log.logIndex, amount0: decoded.amount0, amount1: decoded.amount1, pool };
            }
          }
          audits.push({ kind: decoded.kind, txHash: log.transactionHash, blockNumber: log.blockNumber, logIndex: log.logIndex, wallet: decoded.actor, reason: decoded.kind === 'mint' ? 'Liquidity mint is excluded from independent buy volume.' : 'Liquidity burn is excluded from independent sell volume.' });
        }
      }
      progress('Swaps', `Indexed ${swapLogs.length} swap logs across ${discovered.pools.length} pools`, 70, { targetBlocks, blocksScanned: targetBlocks, pools: discovered.pools.length, swaps: swapLogs.length });
    }

    const raw: RawSwap[] = [];
    for (const item of swapLogs) {
      if (mintTxs.has(item.log.transactionHash.toLowerCase())) {
        audits.push({ kind: 'same-tx-lp', txHash: item.log.transactionHash, blockNumber: item.log.blockNumber, logIndex: item.log.logIndex, reason: 'Swap shares a transaction with a liquidity change, so it is not counted as an independent trade.' });
        continue;
      }
      const decoded = decodeSwap(item.log, item.pool);
      if (decoded) raw.push(decoded);
    }
    raw.sort((a, b) => a.blockNumber - b.blockNumber || a.txIndex - b.txIndex || a.logIndex - b.logIndex);
    const limited = raw.length > 8000 ? raw.slice(0, 8000) : raw;
    if (raw.length > 8000) warnings.push(`Decoded ${raw.length} swaps. The interactive view kept the earliest 8,000 and marked coverage partial. Run the worker for the full archive.`);

    progress('Transactions', 'Reading signers for each swap transaction', 76);
    const uniqueBlocks = [...new Set(limited.map((swap) => swap.blockNumber))];
    await mapLimit(uniqueBlocks, 8, async (blockNumber) => remember(blockNumber));
    const txHashes = [...new Set(limited.map((swap) => swap.txHash))];
    if (earliestMint?.txHash) txHashes.push(earliestMint.txHash as `0x${string}`);
    const txMeta = new Map<string, TxMeta>();
    let missingSigners = 0;
    await mapLimit(txHashes, 12, async (hash) => {
      try {
        const tx = await client.getTransaction({ hash: hash as `0x${string}` });
        txMeta.set(hash.toLowerCase(), { from: getAddress(tx.from), to: tx.to ? getAddress(tx.to) : null });
      } catch {
        missingSigners += 1;
      }
    });
    if (missingSigners) warnings.push(`${missingSigners} transactions had no readable signer. Those rows keep the recipient and say the signer is unknown.`);

    const project = new Map<string, string>();
    if (token.deployer) project.set(token.deployer.toLowerCase(), 'Contract deployer from the creation transaction.');
    const lpSigner = earliestMint ? txMeta.get(earliestMint.txHash.toLowerCase())?.from : undefined;
    if (lpSigner) project.set(lpSigner.toLowerCase(), 'Signer of the first liquidity transaction. Later LPs are not assumed to be the project.');
    for (const wallet of options.projectWallets || []) if (isAddress(wallet)) project.set(getAddress(wallet).toLowerCase(), 'Marked as project-controlled in this workspace.');
    for (const wallet of options.independentWallets || []) if (isAddress(wallet)) project.delete(getAddress(wallet).toLowerCase());

    const byTx = new Map<string, RawSwap[]>();
    for (const swap of limited) byTx.set(swap.txHash.toLowerCase(), [...(byTx.get(swap.txHash.toLowerCase()) || []), swap]);
    const drafts = [...byTx.entries()].flatMap(([hash, swaps]) => reconcileTransaction(swaps, txMeta.get(hash), address));
    let trades: Trade[] = drafts.map((draft) => {
      const block = blockCache.get(draft.blockNumber);
      const timestamp = block?.timestamp || 0;
      const minute = Math.max(0, Math.floor((timestamp - startTs) / 60));
      const trade = blankTrade(draft, minute, timestamp, formatToken(draft.tokenAmount, onchain.decimals));
      if (project.has(trade.wallet.toLowerCase())) {
        trade.isProject = true;
        trade.exclusionReason = project.get(trade.wallet.toLowerCase());
        audits.push({ kind: 'project-trade', txHash: trade.txHash, blockNumber: trade.blockNumber, logIndex: trade.logIndex, wallet: trade.wallet, reason: trade.exclusionReason || 'Project wallet excluded from independent KPIs.' });
      }
      return trade;
    }).filter((trade) => trade.timestamp === 0 || (trade.timestamp >= startTs && trade.timestamp <= endTs));

    progress('Attribution', `Scoring wallets with ${HEURISTIC_VERSION}`, 88);
    const wallets = [...new Set(trades.map((trade) => trade.wallet.toLowerCase()))].slice(0, 250);
    const contracts = new Set<string>();
    await mapLimit(wallets, 10, async (wallet) => {
      try {
        const code = await client.getBytecode({ address: getAddress(wallet) });
        if (code && code !== '0x') contracts.add(wallet);
      } catch {
        /* missing code is recorded as unknown, not as an EOA fact */
      }
    });
    const prior = new Map<string, string[]>();
    for (const [wallet, symbols] of Object.entries(options.priorLaunches || {})) prior.set(wallet.toLowerCase(), symbols);
    trades = classifyTrades(trades, { t0Block: t0Log?.blockNumber ?? null, contracts, priorLaunches: prior });
    trades.sort((a, b) => a.blockNumber - b.blockNumber || a.txIndex - b.txIndex || a.logIndex - b.logIndex);

    const initial = earliestMint ? (sameAddr(earliestMint.pool.token0, WETH) ? earliestMint.amount0 : sameAddr(earliestMint.pool.token1, WETH) ? earliestMint.amount1 : null) : null;
    if (initial !== null) token.initialEth = Number(initial) / 1e18;
    const mintStamp = earliestMint ? await remember(earliestMint.blockNumber) : null;
    const kpis = computeKpis(trades, { initialLiquidityWei: initial, lpEvents: audits.filter((item) => item.kind === 'mint' || item.kind === 'burn').length, t0Block: t0Log?.blockNumber ?? null });
    const poolWei = poolWethOutflow(limited, address);
    const economicWei = trades.reduce((sum, trade) => sum + BigInt(trade.ethWei || 0), 0n);
    const matched = poolWei === economicWei;
    if (!matched) warnings.push('Pool WETH deltas and route-level ETH do not match exactly. Multihop hops can move the same WETH once at route level. Both figures are shown.');
    const tip = await remember(Number(endBlock));
    const items: CoverageItem[] = [
      { id: 'pools', label: 'Discover V2, V3 and V4 pools', state: 'done', detail: `${discovered.pools.length} verified pools` },
      { id: 't0', label: 'Determine first tradable swap (T0)', state: t0Log ? 'done' : 'unavailable', detail: t0Log ? `Block ${t0Log.blockNumber}` : 'Not found in the search cap' },
      { id: 'decode', label: 'Decode canonical swap logs', state: limited.length ? 'done' : 'partial', detail: `${limited.length} swap logs` },
      { id: 'routes', label: 'Reconstruct ETH purchase routes', state: kpis.unsupportedValuationPct > 0 ? 'partial' : 'done', detail: `${kpis.unsupportedValuationPct.toFixed(1)}% of buys lack a WETH valuation` },
      { id: 'lp', label: 'Exclude liquidity events', state: 'done', detail: `${kpis.lpEvents} mint/burn logs kept in the audit stream` },
      { id: 'project', label: 'Exclude project self-trades', state: project.size ? 'done' : 'partial', detail: project.size ? `${project.size} wallets labeled` : 'No deployer or LP signer was identified' },
      { id: 'bots', label: 'Score automation with evidence', state: 'done', detail: HEURISTIC_VERSION },
      { id: 'reconcile', label: 'Reconcile final transaction counts', state: matched ? 'done' : 'partial', detail: `${kpis.buyCount + kpis.sellCount} economic trades from ${limited.length} logs` },
    ];
    token.status = finalizedStatus(headNumber, Number(endBlock));
    const score = coverageScore({ warnings: warnings.length, truncated: raw.length > 8000, kept: limited.length, raw: raw.length, matched });
    progress(score.provisional ? 'Provisional' : 'Ready', score.provisional ? 'Coverage is incomplete. The percentage is the measured remainder, not a timer.' : 'Analysis assembled from chain logs', score.pct, { coveragePct: score.pct, provisional: score.provisional, swaps: limited.length, pools: discovered.pools.length, targetBlocks, blocksScanned: targetBlocks, errors: score.reasons });
    return {
      ok: true,
      origin: 'chain',
      token,
      pools: discovered.pools,
      timeline: {
        deployTimestamp: profile?.deployTimestamp || null,
        poolCreateTimestamp: mintStamp?.timestamp || null,
        firstLiquidityTimestamp: mintStamp?.timestamp || null,
        t0Timestamp: t0Log?.timestamp || null,
        t0Block: t0Log?.blockNumber || null,
        t0Tx: t0Log?.txHash || null,
        t0LogIndex: t0Log?.logIndex || null,
      },
      trades,
      audit: audits,
      kpis,
      coverage: {
        items,
        headBlock: headNumber,
        fromBlock: Number(startBlock),
        toBlock: Number(endBlock),
        indexedAt: Date.now(),
        heuristicVersion: HEURISTIC_VERSION,
        logSource: [...sources].filter(Boolean).join(', ') || 'ethereum-rpc',
        reconciliation: { rawSwapLogs: limited.length, economicTrades: trades.length, poolWethWei: poolWei.toString(), economicWethWei: economicWei.toString(), matched },
        tipHash: tip.hash,
        pct: score.pct,
        provisional: score.provisional,
      },
      window: options.window,
      warnings: [...new Set(warnings)].slice(0, 12),
      projectWallets: [...project.entries()].map(([wallet, reason]) => ({ address: getAddress(wallet), reason })),
      savedAt: Date.now(),
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Analysis failed before any market figures were produced.';
    return { ok: false, origin: 'unavailable', address, reason, warnings };
  }
}

async function pickClient(urls: string[]) {
  let last: unknown;
  for (const url of urls) {
    try {
      const client = createChainClient(url);
      const head = await client.getBlockNumber();
      return { client, url, head };
    } catch (error) {
      last = error;
    }
  }
  throw last instanceof Error ? last : new Error('No Ethereum RPC responded. Add a mainnet URL in Settings.');
}

async function blockAtTimestamp(client: PublicClient, timestamp: number, low: bigint, high: bigint) {
  let lo = low < 0n ? 0n : low;
  let hi = high;
  while (lo < hi) {
    const mid = (lo + hi) / 2n;
    const block = await client.getBlock({ blockNumber: mid });
    if (Number(block.timestamp) < timestamp) lo = mid + 1n;
    else hi = mid;
  }
  return lo;
}

export const ANALYZER_CHAIN_ID = CHAIN_ID;

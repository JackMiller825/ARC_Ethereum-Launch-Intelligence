import { getAddress } from 'viem';
import { planTail } from '../analytics/tail-plan';
import { coverageScore } from '../analytics/coverage';
import type { AnalysisSuccess } from '../types';
import { TOPIC } from './constants';
import { createChainClient, mapLimit, resolveRpcUrls } from './client';
import { decodeLiquidity, decodeSwap } from './decode';
import { blankTrade, reconcileTransaction, type TxMeta } from './economics';
import { classifyTrades } from './heuristics';
import { computeKpis } from './kpis';
import { fetchLogs } from './logs';
import { formatToken } from '../format';
import { finalizedStatus, reorgStatus } from './reorg';

/** Append swaps after the stored tip. A hash mismatch at that tip refuses the append. */
export async function extendAnalysis(snapshot: AnalysisSuccess, options: { rpcUrls?: string[]; signal?: AbortSignal } = {}): Promise<AnalysisSuccess> {
  const urls = resolveRpcUrls(options.rpcUrls);
  const client = createChainClient(urls[0]);
  const head = Number(await client.getBlockNumber());
  const storedTip = await client.getBlock({ blockNumber: BigInt(snapshot.coverage.toBlock) }).catch(() => null);
  const reorg = reorgStatus(
    { blockNumber: snapshot.coverage.toBlock, blockHash: snapshot.coverage.tipHash, chainId: 1 },
    storedTip?.hash || null,
  );
  if (reorg.status === 'reorg') {
    return {
      ...snapshot,
      warnings: [...snapshot.warnings, `Block hash at ${snapshot.coverage.toBlock} no longer matches. Re-run Analyze before trusting a live tail.`],
      coverage: { ...snapshot.coverage, headBlock: head, indexedAt: Date.now(), provisional: true, pct: Math.min(snapshot.coverage.pct ?? 95, 90) },
    };
  }
  const plan = planTail(snapshot.coverage.toBlock, head);
  if (plan.idle) {
    return { ...snapshot, token: { ...snapshot.token, status: finalizedStatus(head, snapshot.coverage.toBlock) }, coverage: { ...snapshot.coverage, headBlock: head, indexedAt: Date.now() } };
  }
  const warnings = [...snapshot.warnings];
  if (plan.remaining > 0) warnings.push(`Live tail covered blocks ${plan.start}–${plan.end}. ${plan.remaining} newer blocks remain outside this pass.`);
  const swapLogs = [];
  const mintTxs = new Set<string>();
  const audits = [...snapshot.audit];
  for (const pool of snapshot.pools) {
    const swapTopic = pool.protocol === 'v2' ? TOPIC.swapV2 : pool.protocol === 'v3' ? TOPIC.swapV3 : TOPIC.swapV4;
    const mintTopic = pool.protocol === 'v2' ? TOPIC.mintV2 : pool.protocol === 'v3' ? TOPIC.mintV3 : TOPIC.modifyV4;
    const logs = await fetchLogs({ urls, address: pool.address as `0x${string}`, topic0: swapTopic, topic1: pool.poolId as `0x${string}` | undefined, fromBlock: BigInt(plan.start), toBlock: BigInt(plan.end), signal: options.signal });
    const mints = await fetchLogs({ urls, address: pool.address as `0x${string}`, topic0: mintTopic, topic1: pool.poolId as `0x${string}` | undefined, fromBlock: BigInt(plan.start), toBlock: BigInt(plan.end), signal: options.signal });
    for (const log of mints.logs) {
      const decoded = decodeLiquidity(log, pool);
      if (!decoded) continue;
      if (decoded.kind === 'mint') mintTxs.add(log.transactionHash.toLowerCase());
      audits.push({ kind: decoded.kind, txHash: log.transactionHash, blockNumber: log.blockNumber, logIndex: log.logIndex, wallet: decoded.actor, reason: decoded.kind === 'mint' ? 'Liquidity mint is excluded from independent buy volume.' : 'Liquidity burn is excluded from independent sell volume.' });
    }
    for (const log of logs.logs) {
      if (mintTxs.has(log.transactionHash.toLowerCase())) continue;
      const decoded = decodeSwap(log, pool);
      if (decoded) swapLogs.push(decoded);
    }
  }
  const txMeta = new Map<string, TxMeta>();
  await mapLimit([...new Set(swapLogs.map((swap) => swap.txHash))], 8, async (hash) => {
    try {
      const tx = await client.getTransaction({ hash });
      txMeta.set(hash.toLowerCase(), { from: getAddress(tx.from), to: tx.to ? getAddress(tx.to) : null, gas: tx.gas?.toString() || null, maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString() || null });
    } catch {
      /* missing signer stays explicit on the trade */
    }
  });
  const byTx = new Map<string, typeof swapLogs>();
  for (const swap of swapLogs) byTx.set(swap.txHash.toLowerCase(), [...(byTx.get(swap.txHash.toLowerCase()) || []), swap]);
  const drafts = [...byTx.entries()].flatMap(([hash, swaps]) => reconcileTransaction(swaps, txMeta.get(hash), snapshot.token.address));
  const blockCache = new Map<number, number>();
  const stamp = async (blockNumber: number) => {
    const cached = blockCache.get(blockNumber);
    if (cached) return cached;
    const block = await client.getBlock({ blockNumber: BigInt(blockNumber) });
    const value = Number(block.timestamp);
    blockCache.set(blockNumber, value);
    return value;
  };
  const startTs = snapshot.timeline.t0Timestamp || snapshot.trades[0]?.timestamp || 0;
  let incoming = await Promise.all(drafts.map(async (draft) => {
    const timestamp = await stamp(draft.blockNumber);
    const minute = startTs ? Math.max(0, Math.floor((timestamp - startTs) / 60)) : 0;
    return blankTrade(draft, minute, timestamp, formatToken(draft.tokenAmount, snapshot.token.decimals));
  }));
  const project = new Set(snapshot.projectWallets.map((item) => item.address.toLowerCase()));
  incoming = incoming.map((trade) => project.has(trade.wallet.toLowerCase()) ? { ...trade, isProject: true, exclusionReason: 'Project label from the stored snapshot.' } : trade);
  incoming = classifyTrades(incoming, { t0Block: snapshot.timeline.t0Block, contracts: new Set(), priorLaunches: new Map() });
  const ids = new Set(snapshot.trades.map((trade) => trade.id));
  const trades = [...snapshot.trades, ...incoming.filter((trade) => !ids.has(trade.id))].sort((a, b) => a.blockNumber - b.blockNumber || a.txIndex - b.txIndex || a.logIndex - b.logIndex);
  const kpis = computeKpis(trades, { initialLiquidityWei: snapshot.kpis.initialLiquidityWei ? BigInt(snapshot.kpis.initialLiquidityWei) : null, lpEvents: audits.filter((item) => item.kind === 'mint' || item.kind === 'burn').length, t0Block: snapshot.timeline.t0Block });
  const score = coverageScore({ warnings: warnings.length + (plan.remaining > 0 ? 1 : 0), truncated: plan.remaining > 0, kept: plan.end - plan.start + 1, raw: plan.end - snapshot.coverage.toBlock, matched: snapshot.coverage.reconciliation.matched });
  const tip = await client.getBlock({ blockNumber: BigInt(plan.end) });
  return {
    ...snapshot,
    trades,
    audit: audits,
    kpis,
    warnings: [...new Set(warnings)].slice(0, 16),
    token: { ...snapshot.token, status: finalizedStatus(head, plan.end) },
    coverage: {
      ...snapshot.coverage,
      headBlock: head,
      toBlock: plan.end,
      indexedAt: Date.now(),
      tipHash: tip.hash || snapshot.coverage.tipHash,
      pct: Math.min(snapshot.coverage.pct ?? score.pct, score.pct),
      provisional: Boolean(snapshot.coverage.provisional) || score.provisional,
      reconciliation: { ...snapshot.coverage.reconciliation, economicTrades: trades.length },
    },
    savedAt: Date.now(),
  };
}

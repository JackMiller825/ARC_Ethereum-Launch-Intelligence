import { getAddress, isAddress, pad, parseAbi, type PublicClient } from 'viem';
import { QUOTES, TOPIC, V2_FACTORIES, V3_FACTORY, V3_FEES, V4_POOL_MANAGER, WETH, ZERO } from './constants';
import { fetchLogsWide, type ChainLog } from './logs';
import { decodeLog } from './logs';
import { initV4 } from './constants';
import type { PoolInfo } from '../types';
import { sameAddr } from '../format';

const v2FactoryAbi = parseAbi(['function getPair(address,address) view returns (address)']);
const v3FactoryAbi = parseAbi(['function getPool(address,address,uint24) view returns (address)']);
const erc20Abi = parseAbi(['function token0() view returns (address)', 'function token1() view returns (address)', 'function fee() view returns (uint24)']);

function topicAddress(address: string) {
  return pad(getAddress(address), { size: 32 });
}

async function readPair(client: PublicClient, address: string) {
  const checksum = getAddress(address);
  const [token0, token1] = await Promise.all([
    client.readContract({ address: checksum, abi: erc20Abi, functionName: 'token0' }),
    client.readContract({ address: checksum, abi: erc20Abi, functionName: 'token1' }),
  ]);
  let fee: number | undefined;
  try {
    fee = Number(await client.readContract({ address: checksum, abi: erc20Abi, functionName: 'fee' }));
  } catch {
    fee = undefined;
  }
  return { address: checksum, token0: getAddress(token0), token1: getAddress(token1), fee };
}

export async function discoverPools(options: {
  client: PublicClient;
  token: string;
  urls: string[];
  fromBlock: bigint;
  toBlock: bigint;
  blockscoutBase: string;
  signal?: AbortSignal;
}): Promise<{ pools: PoolInfo[]; warnings: string[] }> {
  const token = getAddress(options.token);
  const pools: PoolInfo[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  const add = (pool: PoolInfo) => {
    const key = `${pool.protocol}:${(pool.poolId || pool.address).toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    pools.push(pool);
  };

  for (const factory of V2_FACTORIES) {
    for (const quote of QUOTES) {
      if (sameAddr(quote, token)) continue;
      try {
        const pair = await options.client.readContract({
          address: getAddress(factory.address),
          abi: v2FactoryAbi,
          functionName: 'getPair',
          args: [token, getAddress(quote)],
        });
        if (!pair || sameAddr(pair, ZERO)) continue;
        const meta = await readPair(options.client, pair);
        if (!sameAddr(meta.token0, token) && !sameAddr(meta.token1, token)) continue;
        add({ protocol: 'v2', address: meta.address, token0: meta.token0, token1: meta.token1, quote: getAddress(quote), discovery: `${factory.name} factory getPair`, factory: factory.address });
      } catch (error) {
        warnings.push(`${factory.name} ${quote.slice(0, 6)} lookup failed: ${error instanceof Error ? error.message : 'rpc error'}`);
      }
    }
  }

  for (const quote of QUOTES) {
    if (sameAddr(quote, token)) continue;
    for (const fee of V3_FEES) {
      try {
        const pool = await options.client.readContract({
          address: getAddress(V3_FACTORY.address),
          abi: v3FactoryAbi,
          functionName: 'getPool',
          args: [token, getAddress(quote), fee],
        });
        if (!pool || sameAddr(pool, ZERO)) continue;
        const meta = await readPair(options.client, pool);
        add({ protocol: 'v3', address: meta.address, token0: meta.token0, token1: meta.token1, quote: getAddress(quote), fee, discovery: 'Uniswap V3 factory getPool', factory: V3_FACTORY.address });
      } catch {
        /* fee tier miss is normal */
      }
    }
  }

  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`, { signal: options.signal, headers: { accept: 'application/json' } });
    if (response.ok) {
      const body = await response.json() as { pairs?: { chainId?: string; pairAddress?: string; dexId?: string; labels?: string[] }[] };
      for (const hint of body.pairs || []) {
        if (hint.chainId !== 'ethereum' || !hint.pairAddress || !isAddress(hint.pairAddress)) continue;
        if (seen.has(`v2:${hint.pairAddress.toLowerCase()}`) || seen.has(`v3:${hint.pairAddress.toLowerCase()}`)) continue;
        try {
          const meta = await readPair(options.client, hint.pairAddress);
          if (!sameAddr(meta.token0, token) && !sameAddr(meta.token1, token)) continue;
          const protocol = meta.fee ? 'v3' as const : 'v2' as const;
          const quote = sameAddr(meta.token0, token) ? meta.token1 : meta.token0;
          add({ protocol, address: meta.address, token0: meta.token0, token1: meta.token1, quote, fee: meta.fee, discovery: `Dexscreener hint verified on-chain (${hint.dexId || 'unknown dex'})` });
        } catch {
          warnings.push(`Dexscreener hinted ${hint.pairAddress} but the contract did not verify as a V2/V3 pool.`);
        }
      }
    }
  } catch {
    warnings.push('Dexscreener pool hints were unreachable. Canonical factory lookups still ran.');
  }

  let v4Scanned = true;
  const v4 = await discoverV4(options, token).catch((error: unknown) => {
    v4Scanned = false;
    warnings.push(`V4 discovery did not finish: ${error instanceof Error ? error.message : 'rpc error'}. V2 and V3 factory reads are unaffected.`);
    return [] as PoolInfo[];
  });
  v4.forEach(add);
  if (v4Scanned && !pools.some((pool) => pool.protocol === 'v4')) {
    warnings.push('No Uniswap V4 Initialize log matched this token in the scanned block range.');
  }
  if (!pools.length) warnings.push('No canonical pool was found against WETH, USDC, USDT, or DAI.');
  const weth = pools.some((pool) => sameAddr(pool.quote, WETH));
  if (pools.length && !weth) warnings.push('Pools were found, but none are quoted in WETH. ETH totals stay unavailable unless a same-transaction WETH hop can be proven.');
  return { pools, warnings };
}

async function discoverV4(options: { urls: string[]; fromBlock: bigint; toBlock: bigint; blockscoutBase: string; signal?: AbortSignal }, token: string) {
  const pools: PoolInfo[] = [];
  const tokenTopic = topicAddress(token);
  let failures = 0;
  for (const position of ['topic2', 'topic3'] as const) {
    const found = await fetchLogsWide({
      urls: options.urls,
      address: getAddress(V4_POOL_MANAGER),
      topic0: TOPIC.initV4,
      topic2: position === 'topic2' ? tokenTopic : undefined,
      topic3: position === 'topic3' ? tokenTopic : undefined,
      fromBlock: options.fromBlock,
      toBlock: options.toBlock,
      blockscoutBase: options.blockscoutBase,
      signal: options.signal,
    });
    if (!found) {
      failures += 1;
      continue;
    }
    for (const log of found.logs) {
      const decoded = decodeV4Init(log);
      if (!decoded) continue;
      if (!sameAddr(decoded.currency0, token) && !sameAddr(decoded.currency1, token)) continue;
      const quote = sameAddr(decoded.currency0, token) ? decoded.currency1 : decoded.currency0;
      pools.push({
        protocol: 'v4',
        address: getAddress(V4_POOL_MANAGER),
        poolId: decoded.id,
        token0: decoded.currency0,
        token1: decoded.currency1,
        quote,
        fee: decoded.fee,
        discovery: 'Uniswap V4 PoolManager Initialize log',
        factory: V4_POOL_MANAGER,
      });
    }
  }
  if (failures > 0) throw new Error('archive RPC and Blockscout refused part of the V4 Initialize scan');
  return pools;
}

function decodeV4Init(log: ChainLog) {
  try {
    const args = decodeLog(initV4, log).args as { id: string; currency0: string; currency1: string; fee: number | bigint };
    return { id: args.id, currency0: getAddress(args.currency0), currency1: getAddress(args.currency1), fee: Number(args.fee) };
  } catch {
    return null;
  }
}

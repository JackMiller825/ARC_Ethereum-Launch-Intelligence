import type { AbiEvent, Log } from 'viem';
import { decodeEventLog } from 'viem';
import { parseHexOrDec } from '../format';
import { createChainClient, rpcFailureKind, throwIfAborted } from './client';

export type ChainLog = {
  address: string;
  topics: `0x${string}`[];
  data: `0x${string}`;
  blockNumber: number;
  blockHash: string;
  transactionHash: `0x${string}`;
  transactionIndex: number;
  logIndex: number;
  source: 'rpc' | 'blockscout';
};

type FetchArgs = {
  urls: string[];
  address: `0x${string}`;
  topic0: `0x${string}`;
  topic1?: `0x${string}`;
  topic2?: `0x${string}`;
  topic3?: `0x${string}`;
  fromBlock: bigint;
  toBlock: bigint;
  blockscoutBase?: string;
  signal?: AbortSignal;
  onChunk?: (done: number, total: number) => void;
};

function normalizeRpc(log: Log, source: ChainLog['source']): ChainLog {
  return {
    address: log.address,
    topics: [...(log.topics || [])] as `0x${string}`[],
    data: (log.data || '0x') as `0x${string}`,
    blockNumber: Number(log.blockNumber || 0),
    blockHash: log.blockHash || '',
    transactionHash: (log.transactionHash || '0x') as `0x${string}`,
    transactionIndex: Number(log.transactionIndex || 0),
    logIndex: Number(log.logIndex || 0),
    source,
  };
}

async function rpcRange(urls: string[], params: Record<string, unknown>): Promise<ChainLog[] | 'split'> {
  let split = false;
  let last: unknown;
  for (const url of urls) {
    throwIfAborted();
    try {
      const client = createChainClient(url);
      const logs = await client.getLogs(params as never);
      return logs.map((log) => normalizeRpc(log, 'rpc'));
    } catch (error) {
      last = error;
      const kind = rpcFailureKind(error);
      if (kind === 'range' || kind === 'toomany') split = true;
    }
  }
  if (split) return 'split';
  throw last instanceof Error ? last : new Error('Historical eth_getLogs failed on every configured RPC.');
}

async function blockscoutRange(base: string, args: FetchArgs, fromBlock: bigint, toBlock: bigint): Promise<ChainLog[]> {
  const url = new URL(base.replace(/\/$/, '') + '/api');
  url.searchParams.set('module', 'logs');
  url.searchParams.set('action', 'getLogs');
  url.searchParams.set('fromBlock', fromBlock.toString());
  url.searchParams.set('toBlock', toBlock.toString());
  url.searchParams.set('address', args.address);
  url.searchParams.set('topic0', args.topic0);
  if (args.topic1) {
    url.searchParams.set('topic1', args.topic1);
    url.searchParams.set('topic0_1_opr', 'and');
  }
  if (args.topic2) {
    url.searchParams.set('topic2', args.topic2);
    url.searchParams.set('topic0_2_opr', 'and');
  }
  if (args.topic3) {
    url.searchParams.set('topic3', args.topic3);
    url.searchParams.set('topic0_3_opr', 'and');
  }
  const response = await fetch(url, { signal: args.signal, headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Blockscout logs HTTP ${response.status}`);
  const body = await response.json() as { status?: string; message?: string; result?: unknown };
  if (!Array.isArray(body.result)) {
    if (String(body.message || '').toLowerCase().includes('no records') || body.status === '0') return [];
    throw new Error(`Blockscout logs unavailable: ${body.message || 'empty result'}`);
  }
  return body.result.map((row) => {
    const item = row as Record<string, string | string[]>;
    const topics = (Array.isArray(item.topics) ? item.topics : [item.topic0, item.topic1, item.topic2, item.topic3].filter(Boolean)) as string[];
    return {
      address: String(item.address),
      topics: topics.filter(Boolean) as `0x${string}`[],
      data: String(item.data || '0x') as `0x${string}`,
      blockNumber: Number(parseHexOrDec(String(item.blockNumber))),
      blockHash: String(item.blockHash || ''),
      transactionHash: String(item.transactionHash) as `0x${string}`,
      transactionIndex: Number(parseHexOrDec(String(item.transactionIndex || '0'))),
      logIndex: Number(parseHexOrDec(String(item.logIndex || '0'))),
      source: 'blockscout' as const,
    };
  });
}

async function rangeLogs(args: FetchArgs, fromBlock: bigint, toBlock: bigint): Promise<{ logs: ChainLog[]; source: string }> {
  throwIfAborted(args.signal);
  if (fromBlock > toBlock) return { logs: [], source: 'none' };
  const params: Record<string, unknown> = {
    address: args.address,
    fromBlock,
    toBlock,
  };
  const topics: (`0x${string}` | null)[] = [args.topic0];
  if (args.topic1 || args.topic2 || args.topic3) {
    topics.push(args.topic1 || null);
    if (args.topic2 || args.topic3) topics.push(args.topic2 || null);
    if (args.topic3) topics.push(args.topic3);
  }
  params.topics = topics;
  try {
    const rpc = await rpcRange(args.urls, params);
    if (rpc !== 'split') return { logs: rpc, source: 'ethereum-rpc' };
  } catch {
    /* try a narrower range, then Blockscout */
  }
  if (toBlock - fromBlock <= 10n) {
    if (args.blockscoutBase) {
      const logs = await blockscoutRange(args.blockscoutBase, args, fromBlock, toBlock);
      return { logs, source: 'blockscout-log-index' };
    }
    throw new Error(`Could not read logs for blocks ${fromBlock}-${toBlock}. Add an archive Ethereum RPC in Settings.`);
  }
  const mid = fromBlock + (toBlock - fromBlock) / 2n;
  const left = await rangeLogs(args, fromBlock, mid);
  const right = await rangeLogs(args, mid + 1n, toBlock);
  const source = left.source === right.source ? left.source : `${left.source}+${right.source}`;
  return { logs: left.logs.concat(right.logs), source };
}

export async function fetchLogs(args: FetchArgs) {
  const chunk = 2000n;
  const total = Number(args.toBlock - args.fromBlock + 1n);
  const all: ChainLog[] = [];
  const sources = new Set<string>();
  let done = 0;
  for (let cursor = args.fromBlock; cursor <= args.toBlock; cursor += chunk) {
    const end = cursor + chunk - 1n > args.toBlock ? args.toBlock : cursor + chunk - 1n;
    const part = await rangeLogs(args, cursor, end);
    all.push(...part.logs);
    sources.add(part.source);
    done += Number(end - cursor + 1n);
    args.onChunk?.(Math.min(done, total), total);
  }
  all.sort((a, b) => a.blockNumber - b.blockNumber || a.transactionIndex - b.transactionIndex || a.logIndex - b.logIndex);
  return { logs: all, source: [...sources].join('+') || 'none' };
}

export async function findEarliestLog(args: FetchArgs): Promise<{ log: ChainLog | null; source: string }> {
  const chunk = 2000n;
  let source = 'none';
  for (let cursor = args.fromBlock; cursor <= args.toBlock; cursor += chunk) {
    const end = cursor + chunk - 1n > args.toBlock ? args.toBlock : cursor + chunk - 1n;
    const found = await rangeLogs({ ...args, fromBlock: cursor, toBlock: end }, cursor, end);
    source = found.source;
    if (found.logs.length) return { log: found.logs[0], source };
  }
  return { log: null, source };
}

/** One-shot wide read. Returns null when every endpoint refuses the span, so callers can narrow it. */
export async function fetchLogsWide(args: FetchArgs): Promise<{ logs: ChainLog[]; source: string } | null> {
  const topics: (`0x${string}` | null)[] = [args.topic0];
  if (args.topic1 || args.topic2 || args.topic3) {
    topics.push(args.topic1 || null);
    if (args.topic2 || args.topic3) topics.push(args.topic2 || null);
    if (args.topic3) topics.push(args.topic3);
  }
  const params: Record<string, unknown> = { address: args.address, fromBlock: args.fromBlock, toBlock: args.toBlock, topics };
  try {
    const rpc = await rpcRange(args.urls, params);
    if (rpc !== 'split') return { logs: rpc, source: 'ethereum-rpc' };
  } catch {
    /* fall through */
  }
  if (!args.blockscoutBase) return null;
  try {
    const logs = await blockscoutRange(args.blockscoutBase, args, args.fromBlock, args.toBlock);
    return { logs, source: 'blockscout-log-index' };
  } catch {
    return null;
  }
}

export function decodeLog<T extends AbiEvent>(abiEvent: T, log: ChainLog) {
  return decodeEventLog({ abi: [abiEvent], data: log.data, topics: log.topics as [signature: `0x${string}`, ...`0x${string}`[]] });
}

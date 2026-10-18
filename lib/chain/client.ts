import { createPublicClient, http, type PublicClient } from 'viem';
import { mainnet } from 'viem/chains';
import { DEFAULT_RPCS } from './constants';

export function rpcFailureKind(error: unknown): 'range' | 'toomany' | 'archive' | 'other' {
  const msg = (error instanceof Error ? `${error.message} ${'cause' in error ? String(error.cause) : ''}` : String(error)).toLowerCase();
  if (msg.includes('more than') || msg.includes('too many') || msg.includes('response size') || msg.includes('query returned more') || msg.includes('exceeded max') || msg.includes('log response size')) return 'toomany';
  if (msg.includes('archive') || msg.includes('pruned') || msg.includes('historical state')) return 'archive';
  if (msg.includes('range') || msg.includes('block range') || msg.includes('free plan') || msg.includes('limited to') || msg.includes('10 block') || msg.includes('50 block')) return 'range';
  return 'other';
}

export function createChainClient(url: string): PublicClient {
  return createPublicClient({
    chain: mainnet,
    transport: http(url, { timeout: 22_000, retryCount: 1, retryDelay: 300, batch: { batchSize: 40, wait: 16 } }),
  });
}

export function resolveRpcUrls(custom?: string[]) {
  const fromEnv = (process.env.ETHEREUM_RPC_URL || '').split(',').map((item) => item.trim()).filter(Boolean);
  const merged = [...(custom || []), ...fromEnv, ...DEFAULT_RPCS];
  return [...new Set(merged)];
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      out[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return out;
}

export function backoffMs(attempt: number) {
  const step = Math.max(0, Math.floor(attempt));
  return Math.min(8000, 250 * 2 ** step);
}

export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new Error('Analysis cancelled.');
}

export type Checkpoint = { blockNumber: number; blockHash: string; chainId: number };

export function reorgStatus(stored: Checkpoint | null, liveHash: string | null) {
  if (!stored) return { status: 'fresh' as const, rollbackTo: null as number | null };
  if (!liveHash) return { status: 'unknown' as const, rollbackTo: Math.max(0, stored.blockNumber - 64) };
  if (liveHash.toLowerCase() === stored.blockHash.toLowerCase()) return { status: 'confirmed' as const, rollbackTo: null };
  return { status: 'reorg' as const, rollbackTo: Math.max(0, stored.blockNumber - 64) };
}

export function finalizedStatus(head: number, blockNumber: number) {
  const depth = head - blockNumber;
  if (depth >= 64) return 'finalized' as const;
  if (depth >= 12) return 'confirmed' as const;
  return 'provisional' as const;
}

/** A live tail never jumps more than maxSpan blocks. The remainder stays visible as uncovered. */
export function planTail(fromBlock: number, head: number, maxSpan = 2000) {
  if (!Number.isFinite(fromBlock) || !Number.isFinite(head) || head <= fromBlock) {
    return { start: fromBlock, end: fromBlock, remaining: 0, idle: true };
  }
  const end = Math.min(head, fromBlock + maxSpan);
  return { start: fromBlock + 1, end, remaining: Math.max(0, head - end), idle: false };
}

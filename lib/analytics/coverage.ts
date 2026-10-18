export function coverageScore(input: { warnings: number; truncated: boolean; kept: number; raw: number; matched: boolean }) {
  let pct = 100;
  const reasons: string[] = [];
  if (input.warnings > 0) {
    pct = Math.min(pct, 95);
    reasons.push('The run recorded a warning.');
  }
  if (input.truncated && input.raw > 0) {
    pct = Math.min(pct, Math.floor((input.kept / input.raw) * 100));
    reasons.push('The interactive swap cap dropped later logs.');
  }
  if (!input.matched) {
    pct = Math.min(pct, 90);
    reasons.push('Pool WETH and route ETH did not match.');
  }
  if (pct < 0) pct = 0;
  return { pct, provisional: pct < 100, reasons };
}

export function backoffMs(attempt: number) {
  const step = Math.max(0, Math.floor(attempt));
  return Math.min(8000, 250 * 2 ** step);
}

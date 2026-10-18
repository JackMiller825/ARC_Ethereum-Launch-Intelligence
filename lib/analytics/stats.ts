export function percentile(values: number[], p: number) {
  const clean = values.filter((value) => Number.isFinite(value)).slice().sort((a, b) => a - b);
  if (!clean.length || p < 0 || p > 100) return null;
  const index = (clean.length - 1) * (p / 100);
  const low = Math.floor(index);
  const high = Math.ceil(index);
  if (low === high) return clean[low];
  return clean[low] * (high - index) + clean[high] * (index - low);
}

/** Pearson r. A value is not evidence that one launch caused another. */
export function pearson(xs: number[], ys: number[]) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return { r: null as number | null, n, note: 'Fewer than 3 paired observations. No correlation is reported.' };
  const x = xs.slice(0, n);
  const y = ys.slice(0, n);
  const mean = (rows: number[]) => rows.reduce((sum, value) => sum + value, 0) / rows.length;
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return { r: null, n, note: 'One series does not vary. Correlation is undefined.' };
  const r = num / Math.sqrt(dx * dy);
  return { r, n, note: 'Correlation describes this sample only. It does not show that one metric caused the other.' };
}

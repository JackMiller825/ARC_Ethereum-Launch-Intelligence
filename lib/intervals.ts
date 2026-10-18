import type { Interval, Trade, WindowSpec } from './types';

export const durations: Record<Exclude<Interval, 'custom'>, number> = {
  '1m': 1,
  '3m': 3,
  '5m': 5,
  '10m': 10,
  '15m': 15,
  '30m': 30,
  '1h': 60,
  '2h': 120,
  '3h': 180,
  '6h': 360,
  '12h': 720,
  '24h': 1440,
  '3d': 4320,
  '7d': 10080,
  '14d': 20160,
  '30d': 43200,
};

export const INTERVALS = Object.keys(durations) as Exclude<Interval, 'custom'>[];
export const MAX_MINUTES = durations['30d'];
export const MIN_MINUTES = 1;

export function clampMinutes(value: number) {
  if (!Number.isFinite(value)) return 60;
  return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, Math.round(value)));
}

export function intervalForMinutes(minutes: number): Interval {
  const match = INTERVALS.find((key) => durations[key] === minutes);
  return match || 'custom';
}

export function minutesOf(spec: WindowSpec) {
  return clampMinutes(spec.minutes);
}

export function windowLabel(spec: WindowSpec) {
  if (spec.mode === 'launch') return `First ${spec.minutes}m after T0`;
  if (spec.mode === 'trailing') return `Trailing ${spec.minutes}m`;
  return `${spec.startIso} → ${spec.endIso} UTC`;
}

export function filterTrades(trades: Trade[], minutes: number) {
  const cap = clampMinutes(minutes);
  return trades.filter((trade) => trade.minute >= 0 && trade.minute < cap);
}

/** Full indexed window, including a swap timestamped on the closing second. A shorter selection drops later minutes. */
export function tradesInView<T extends { minute: number }>(trades: T[], requestedMinutes: number, storedMinutes: number) {
  if (requestedMinutes >= storedMinutes) return trades;
  return trades.filter((trade) => trade.minute >= 0 && trade.minute < clampMinutes(requestedMinutes));
}

export function absoluteMinutes(startIso: string, endIso: string) {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error('Absolute window needs a UTC end after the start.');
  }
  const minutes = Math.ceil((end - start) / 60000);
  if (minutes > MAX_MINUTES) throw new Error(`Window is ${minutes} minutes. The maximum is ${MAX_MINUTES} (30 days).`);
  return minutes;
}

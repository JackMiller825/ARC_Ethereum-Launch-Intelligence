import { computeKpis } from '../chain/kpis';
import { tradesInView } from '../intervals';
import type { AnalysisSuccess, WindowSpec } from '../types';

/** A stored launch index can answer a shorter launch window. A rolling window is reused only while it is still fresh. */
export function snapshotCovers(snapshot: AnalysisSuccess, window: WindowSpec, now = Date.now()) {
  if (snapshot.window.mode !== window.mode) return false;
  if (window.mode === 'absolute') {
    if (snapshot.window.mode !== 'absolute') return false;
    return Date.parse(snapshot.window.startIso) <= Date.parse(window.startIso) && Date.parse(snapshot.window.endIso) >= Date.parse(window.endIso);
  }
  if (snapshot.window.minutes < window.minutes) return false;
  if (window.mode === 'trailing' && now - snapshot.savedAt > 120_000) return false;
  return true;
}

export function viewFromSnapshot(snapshot: AnalysisSuccess, window: WindowSpec): AnalysisSuccess {
  const trades = window.mode === 'absolute' && snapshot.window.mode === 'absolute'
    ? snapshot.trades.filter((trade) => trade.timestamp >= Math.floor(Date.parse(window.startIso) / 1000) && trade.timestamp <= Math.floor(Date.parse(window.endIso) / 1000))
    : tradesInView(snapshot.trades, window.minutes, snapshot.window.minutes);
  const kpis = computeKpis(trades, {
    initialLiquidityWei: snapshot.kpis.initialLiquidityWei ? BigInt(snapshot.kpis.initialLiquidityWei) : null,
    lpEvents: snapshot.kpis.lpEvents,
    t0Block: snapshot.timeline.t0Block,
  });
  return { ...snapshot, trades, kpis, window, warnings: [...snapshot.warnings, 'This view reuses a stored index and did not rescan the chain.'] };
}

"use client";
import { useEffect, useRef, useState } from 'react';
import { dedupeAlerts, diffAlerts, type ResearchAlert } from '@/lib/analytics/alerts';
import { extendAnalysis } from '@/lib/chain/tail';
import { useWorkspace } from './workspace';
import { loadAlertLog, saveAlertLog, saveSnapshot } from '@/lib/store/idb';
import type { RefreshMode } from '@/lib/types';

const MODES: { id: RefreshMode; label: string }[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'block', label: 'Per block' },
  { id: '15', label: '15s' },
  { id: '30', label: '30s' },
  { id: '60', label: '1m' },
  { id: '300', label: '5m' },
];

function delay(mode: RefreshMode) {
  if (mode === 'manual') return 0;
  if (mode === 'block') return 12_000;
  return Number(mode) * 1000;
}

export function LiveMonitor() {
  const { active, setActive, settings, updateSettings } = useWorkspace();
  const [note, setNote] = useState('Idle. This browser stops watching when the tab is closed. That is not 24/7 monitoring.');
  const [alerts, setAlerts] = useState<ResearchAlert[]>([]);
  const busy = useRef(false);
  const activeRef = useRef(active);
  activeRef.current = active;

  async function tick() {
    const current = activeRef.current;
    if (!current || busy.current) return;
    busy.current = true;
    setNote(`Checking blocks after ${current.coverage.toBlock}.`);
    try {
      const next = await extendAnalysis(current, { rpcUrls: settings.rpcUrls });
      const incoming = diffAlerts(current, next, { minBuyEth: settings.alertBuyEth, minSellEth: settings.alertSellEth, coverageFloor: settings.coverageFloor, buyerBurst: 5 });
      setAlerts((existing) => {
        const merged = dedupeAlerts(existing, incoming);
        void saveAlertLog(merged);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          incoming.forEach((item) => new Notification(`${item.token}: ${item.summary}`));
        }
        return merged;
      });
      setActive(next);
      await saveSnapshot(next);
      const age = Math.max(0, Math.round((Date.now() - next.coverage.indexedAt) / 1000));
      setNote(`Head ${next.coverage.headBlock}. Indexed through ${next.coverage.toBlock}. ${next.token.status}. Updated ${age}s ago. A refresh interval does not change block time or finality.`);
    } catch (error) {
      setAlerts((existing) => { const merged = dedupeAlerts(existing, [{ id: `index:${Date.now()}`, token: current.token.symbol, kind: 'index', at: Date.now(), summary: error instanceof Error ? error.message : 'Live tail failed' }]); void saveAlertLog(merged); return merged; });
      setNote('The live tail failed. The stored snapshot was not replaced with estimated trades.');
    } finally {
      busy.current = false;
    }
  }

  useEffect(() => { void loadAlertLog().then(setAlerts).catch(() => undefined); }, []);

  useEffect(() => {
    const ms = delay(settings.refreshMode);
    if (!ms || !active) return;
    const id = window.setInterval(() => { void tick(); }, ms);
    return () => window.clearInterval(id);
  }, [settings.refreshMode, active?.token.address, settings.alertBuyEth, settings.alertSellEth, settings.coverageFloor, settings.rpcUrls]);

  return <section className="panel" style={{ marginBottom: 18 }}><div className="panel-header"><div><div className="panel-eyebrow">LIVE TAIL</div><h3>New blocks for the open token</h3></div><button className="btn secondary" type="button" onClick={() => void tick()} disabled={!active}>Check now</button></div>
    <div className="intervals" role="group" aria-label="Refresh mode">{MODES.map((mode) => <button key={mode.id} type="button" className={settings.refreshMode === mode.id ? 'selected' : ''} onClick={() => void updateSettings({ ...settings, refreshMode: mode.id })}>{mode.label}</button>)}</div>
    <p className="panel-desc">{note} Browser notifications fire only after you allow them, and only while this tab is open.</p>
    <button className="btn ghost" type="button" onClick={() => { if (typeof Notification !== 'undefined') void Notification.requestPermission(); }}>Allow browser notifications</button>
    {alerts.slice(-6).reverse().map((item) => <div className="coverage-row" key={item.id}><span>{item.kind}</span><span>{item.summary}</span>{item.txHash && <a href={`https://etherscan.io/tx/${item.txHash}`}>tx</a>}<button className="btn ghost" type="button" onClick={() => setAlerts((rows) => rows.filter((row) => row.id !== item.id))}>Dismiss</button></div>)}
  </section>;
}

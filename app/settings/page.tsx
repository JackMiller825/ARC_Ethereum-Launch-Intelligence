"use client";
import { useState } from 'react';
import { ShieldCheck } from '@/components/icons';
import { PageHeading, Pill } from '@/components/ui';
import { CoveragePanel } from '@/components/coverage-panel';
import { useWorkspace } from '@/components/workspace';
import { versionMismatch } from '@/lib/analytics/version-check';
import { BASE_PATH, BUILD_TIME, COMMIT_SHA, PACKAGE_VERSION, shortSha } from '@/lib/build-info';
import { HEURISTIC_VERSION } from '@/lib/chain/constants';
import { createChainClient } from '@/lib/chain/client';

export default function Settings() {
  const { settings, updateSettings, snapshots, reset, active } = useWorkspace();
  const [rpcText, setRpcText] = useState(settings.rpcUrls.join('\n'));
  const [status, setStatus] = useState('Not tested');
  const [versionNote, setVersionNote] = useState('Not checked');
  async function checkVersion() {
    try {
      const response = await fetch(`${BASE_PATH}/version.json?ts=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json() as { commit?: string; builtAt?: string; backend?: string };
      const mismatch = versionMismatch(COMMIT_SHA, body.commit);
      setVersionNote(mismatch ? `This tab is ${shortSha(COMMIT_SHA)}. Published file is ${shortSha(body.commit || '')}. Reload to pick up the new bundle.` : `Match ${shortSha(body.commit || COMMIT_SHA)}. Built ${body.builtAt || BUILD_TIME || 'unknown'}. Backend: ${body.backend || 'not bundled with Pages'}.`);
    } catch (error) {
      setVersionNote(error instanceof Error ? error.message : 'Version file unavailable');
    }
  }
  async function testRpc() {
    const urls = rpcText.split('\n').map((line) => line.trim()).filter(Boolean);
    const url = urls[0] || 'https://rpc.mevblocker.io';
    try {
      const block = await createChainClient(url).getBlockNumber();
      setStatus(`${url} · head ${block.toString()}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'RPC failed');
    }
  }
  return <>
    <PageHeading eyebrow="SYSTEM / DATA & SETTINGS" title="Evidence you can audit." description="RPC URLs stay in this browser. The app never asks for a seed phrase or a signature." />
    <div className="settings-grid">
      <section className="panel"><div className="panel-eyebrow">CONNECTIVITY</div><h3>Upstream sources</h3>
        <div className="setting-row"><div><strong>Ethereum RPC</strong><p>One URL per line. Blank uses the public archive fallbacks. A custom URL can include its own key.</p></div><Pill kind="green">BROWSER</Pill></div>
        <textarea className="field" data-tour="rpc-list" aria-label="RPC URLs" value={rpcText} onChange={(e) => setRpcText(e.target.value)} rows={4} />
        <div className="feature-actions" style={{ marginTop: 12 }}><button className="btn secondary" type="button" onClick={testRpc}>Test first URL</button><button className="btn primary" type="button" onClick={() => updateSettings({ ...settings, rpcUrls: rpcText.split('\n').map((line) => line.trim()).filter(Boolean) })}>Save RPCs</button></div>
        <p className="panel-desc">{status}</p>
        <div className="setting-row"><div><strong>Blockscout</strong><p>Creation transactions, holder counts and a log-index fallback. Swap math still uses decoded logs.</p></div><Pill kind="blue">OPTIONAL</Pill></div>
        <div className="setting-row"><div><strong>PostgreSQL worker</strong><p>Docker Compose persists the same analysis when DATABASE_URL is set. GitHub Pages keeps history in IndexedDB.</p></div><Pill kind="blue">{snapshots.length} LOCAL</Pill></div>
        <label className="check-row"><input type="checkbox" checked={settings.demoMode} onChange={(e) => updateSettings({ ...settings, demoMode: e.target.checked })} /><span>Show synthetic demo fixtures. Off by default. Live analysis never falls back to them.</span></label>
        <label className="check-row"><input type="checkbox" checked={settings.brandAuto} onChange={(e) => updateSettings({ ...settings, brandAuto: e.target.checked })} /><span>Score the on-chain name automatically on the Token Analyzer brand tab. The score stays out of trading totals.</span></label>
      </section>
      <section className="panel"><div className="panel-eyebrow">METHODOLOGY</div><h3>{HEURISTIC_VERSION}</h3>{['Block timestamps are UTC', 'Ordering is block, transaction index, log index', 'ERC-20 Transfer logs are not treated as swaps', 'A multihop route counts WETH once', 'Deployer and first LP signer are project labels', 'A hash mismatch at the same height rolls the checkpoint back 64 blocks', 'HIGH and MEDIUM enter the automated total. LOW, including market-making hints, stays out', 'MEV is a same-block flip without a victim. Sandwich requires a surrounded buy', 'Failed swaps stay unavailable without a trace API', 'Coverage stays under 100% when a warning, cap, or reconciliation gap is present', 'Windows run from 1 minute through 30 days'].map((item) => <div key={item} className="method-row"><ShieldCheck size={16} />{item}</div>)}<p className="panel-desc">Package {PACKAGE_VERSION} is the npm package name, not the deploy identity. This bundle is commit {COMMIT_SHA} ({shortSha()}) built {BUILD_TIME || 'during this session'}. Heuristic {HEURISTIC_VERSION}. Frontend and backend are separate: GitHub Pages does not run the worker.</p><button className="btn secondary" type="button" onClick={() => void checkVersion()}>Check published version</button><p className="panel-desc">{versionNote}</p><p className="panel-desc">Latest log source: {active?.coverage.logSource || 'none'}.</p></section>
    </div>
    <div className="settings-grid">
      <section className="panel"><div className="panel-eyebrow">NOTIFICATIONS</div><h3>Browser-only alerts</h3><p className="panel-desc">These thresholds stay in IndexedDB on this browser. They do not run when the tab is closed, and GitHub Pages does not host a 24/7 watcher.</p>
        <label className="stack-label">Buy threshold (ETH)<div className="input-with-unit"><input aria-label="Buy alert threshold" type="number" min="0" step="0.1" value={settings.alertBuyEth} onChange={(event) => updateSettings({ ...settings, alertBuyEth: Math.max(0, Number(event.target.value) || 0) })} /></div></label>
        <label className="stack-label">Sell threshold (ETH)<div className="input-with-unit"><input aria-label="Sell alert threshold" type="number" min="0" step="0.1" value={settings.alertSellEth} onChange={(event) => updateSettings({ ...settings, alertSellEth: Math.max(0, Number(event.target.value) || 0) })} /></div></label>
        <label className="stack-label">Coverage floor (%)<div className="input-with-unit"><input aria-label="Coverage floor" type="number" min="0" max="100" value={settings.coverageFloor} onChange={(event) => updateSettings({ ...settings, coverageFloor: Math.max(0, Math.min(100, Number(event.target.value) || 0)) })} /></div></label>
      </section>
      <section className="panel"><div className="panel-eyebrow">LOCAL ARCHIVE</div><h3>Workspace storage</h3><p className="panel-desc">Saved snapshots, the playbook, RPC URLs, and wallet labels live in this browser. Clearing them does not touch mainnet and does not delete notes or recognition responses. A configured Postgres worker is a separate process and is not running on GitHub Pages.</p><button className="btn secondary" type="button" onClick={() => { if (window.confirm('Clear saved snapshots and the playbook in this browser?')) reset(); }}>Clear local history</button></section>
    </div>
    <CoveragePanel />
  </>;
}

"use client";
import { useState } from 'react';
import { ShieldCheck } from '@/components/icons';
import { PageHeading, Pill } from '@/components/ui';
import { useWorkspace } from '@/components/workspace';
import { HEURISTIC_VERSION } from '@/lib/chain/constants';
import { createChainClient } from '@/lib/chain/client';

export default function Settings() {
  const { settings, updateSettings, snapshots, reset, active } = useWorkspace();
  const [rpcText, setRpcText] = useState(settings.rpcUrls.join('\n'));
  const [status, setStatus] = useState('Not tested');
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
        <textarea aria-label="RPC URLs" value={rpcText} onChange={(e) => setRpcText(e.target.value)} rows={4} style={{ width: '100%', background: '#0d1728', color: 'white', border: '1px solid #344259', borderRadius: 8, padding: 12, fontFamily: 'DM Mono, monospace' }} />
        <div className="feature-actions" style={{ marginTop: 12 }}><button className="btn secondary" type="button" onClick={testRpc}>Test first URL</button><button className="btn primary" type="button" onClick={() => updateSettings({ ...settings, rpcUrls: rpcText.split('\n').map((line) => line.trim()).filter(Boolean) })}>Save RPCs</button></div>
        <p className="panel-desc">{status}</p>
        <div className="setting-row"><div><strong>Blockscout</strong><p>Creation transactions, holder counts and a log-index fallback. Swap math still uses decoded logs.</p></div><Pill kind="blue">OPTIONAL</Pill></div>
        <div className="setting-row"><div><strong>PostgreSQL worker</strong><p>Docker Compose persists the same analysis when DATABASE_URL is set. GitHub Pages keeps history in IndexedDB.</p></div><Pill kind="blue">{snapshots.length} LOCAL</Pill></div>
        <label className="check-row"><input type="checkbox" checked={settings.demoMode} onChange={(e) => updateSettings({ ...settings, demoMode: e.target.checked })} /><span>Show synthetic demo fixtures. Off by default. Live analysis never falls back to them.</span></label>
      </section>
      <section className="panel"><div className="panel-eyebrow">METHODOLOGY</div><h3>{HEURISTIC_VERSION}</h3>{['Block timestamps are UTC', 'Ordering is block, transaction index, log index', 'ERC-20 Transfer logs are not treated as swaps', 'A multihop route counts WETH once', 'Deployer and first LP signer are project labels', 'A hash mismatch at the same height rolls the checkpoint back 64 blocks', 'HIGH and MEDIUM enter the automated total. LOW, including market-making hints, stays out', 'MEV is a same-block flip without a victim. Sandwich requires a surrounded buy', 'Failed swaps stay unavailable without a trace API', 'Coverage stays under 100% when a warning, cap, or reconciliation gap is present', 'Windows run from 1 minute through 30 days'].map((item) => <div key={item} className="method-row"><ShieldCheck size={16} />{item}</div>)}<p className="panel-desc">Latest log source: {active?.coverage.logSource || 'none'}.</p></section>
    </div>
    <section className="panel"><div className="panel-eyebrow">LOCAL ARCHIVE</div><h3>Workspace storage</h3><p className="panel-desc">Clearing storage deletes saved snapshots, the playbook and wallet labels on this browser. It does not touch mainnet.</p><button className="btn secondary" type="button" onClick={() => reset()}>Clear local history</button></section>
  </>;
}

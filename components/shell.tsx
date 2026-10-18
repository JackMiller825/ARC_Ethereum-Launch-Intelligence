"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { versionMismatch } from '@/lib/analytics/version-check';
import { BASE_PATH, BUILD_TIME, COMMIT_SHA, shortSha } from '@/lib/build-info';
import { WorkspaceProvider, useWorkspace } from './workspace';
import { Activity, Bell, Bot, ChevronRight, History, LayoutDashboard, Menu, Search, Settings2, Target, Wallet, X } from './icons';

function VersionNotice() {
  const [stale, setStale] = useState('');
  useEffect(() => {
    let stop = false;
    fetch(`${BASE_PATH}/version.json?ts=${Date.now()}`, { cache: 'no-store' }).then((response) => response.ok ? response.json() : null).then((body) => {
      if (stop || !body) return;
      if (versionMismatch(COMMIT_SHA, body.commit)) setStale(String(body.commit));
    }).catch(() => {});
    return () => { stop = true; };
  }, []);
  if (!stale) return null;
  return <div className="data-boundary"><div><strong>This tab is on {shortSha(COMMIT_SHA)}. The published build is {shortSha(stale)}.</strong><p>Reload to replace the cached bundle.</p></div><button className="btn ghost" type="button" onClick={() => window.location.reload()}>Reload</button></div>;
}

const navigation = [
  { section: 'WORKSPACE', items: [
    { href: '/', name: 'Overview', icon: LayoutDashboard },
    { href: '/analysis', name: 'Token Analyzer', icon: Search },
    { href: '/planner', name: 'Launch Planner', icon: Target },
    { href: '/bots', name: 'Bot Intelligence', icon: Bot },
  ] },
  { section: 'RESEARCH', items: [
    { href: '/wallets', name: 'Wallet Explorer', icon: Wallet },
    { href: '/history', name: 'Token History', icon: History },
  ] },
  { section: 'SYSTEM', items: [
    { href: '/settings', name: 'Data & Settings', icon: Settings2 },
  ] },
];

function freshness(indexedAt?: number) {
  if (!indexedAt) return 'No index';
  const seconds = Math.max(0, Math.round((Date.now() - indexedAt) / 1000));
  if (seconds < 90) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return minutes < 90 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`;
}

function Frame({ children }: { children: React.ReactNode }) {
  const path = (usePathname() || '/').replace(/\/$/, '') || '/';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const workspace = useWorkspace();
  const page = navigation.flatMap((group) => group.items).find((item) => item.href === path)?.name || 'Overview';
  const token = workspace.active?.token;
  const indexedAt = workspace.active?.coverage.indexedAt;
  const fresh = Boolean(indexedAt && Date.now() - indexedAt < 5 * 60 * 1000);
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><Activity size={20} /></div>
        <div><div className="brand-title">ARC<span className="brand-period">.</span></div><div className="brand-sub">LAUNCH INTELLIGENCE</div></div>
        <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
      </div>
      <div className="side-workspace">
        <span className="side-kicker">NETWORK</span>
        <div className="workspace-name"><span className="workspace-dot" /> Ethereum Mainnet <ChevronRight size={14} /></div>
      </div>
      <nav className="side-nav" aria-label="Primary">
        {navigation.map((group) => <div key={group.section}>
          <div className="nav-caption">{group.section}</div>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = path === item.href;
            return <Link key={item.href} href={item.href} className={`nav-link ${active ? 'active' : ''}`} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined}><Icon size={18} /><span>{item.name}</span>{active && <span className="active-notch" />}</Link>;
          })}
        </div>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="health-grid">
          <div className="health-row"><span>RPC</span><strong>{workspace.settings.rpcUrls.length ? 'Custom' : 'Public'}</strong></div>
          <div className="health-row"><span>Indexed block</span><strong>{workspace.active?.coverage.toBlock ?? '—'}</strong></div>
          <div className="health-row"><span>Freshness</span><strong>{freshness(indexedAt)}</strong></div>
          <div className="health-row"><span>Health</span><strong><span className={`health-dot ${fresh || !workspace.active ? 'ok' : ''}`} /> {workspace.progress ? 'Indexing' : fresh ? 'Current' : workspace.active ? 'Stored' : 'Idle'}</strong></div>
        </div>
        <div className="side-foot"><span>ARC TERMINAL</span><span title={BUILD_TIME || 'Build time unavailable'}>{shortSha()}</span></div>
      </div>
    </aside>
    <div className="main-column">
      <header className="topbar">
        <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={18} /></button>
        <div className="top-title">
          <strong>{page}</strong>
          <span>{token ? `${token.name} · ${token.symbol}` : 'No token selected'}</span>
        </div>
        <form className="top-search" onSubmit={(event) => { event.preventDefault(); const next = query.trim(); router.push(next ? `/analysis?ca=${encodeURIComponent(next)}` : '/analysis'); setQuery(''); }}>
          <Search size={15} />
          <input aria-label="Global contract search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Paste a contract address" spellCheck={false} />
        </form>
        <div className="header-right">
          <div className="network-pill"><span className="pulse-dot" /> Ethereum</div>
          <span>{workspace.progress ? workspace.progress.stage : 'Indexer idle'}</span>
          <button className="icon-btn" type="button" aria-label="Notification permission" title="Browser notifications stay in this tab" onClick={() => { if (typeof Notification !== 'undefined') void Notification.requestPermission(); }}><Bell size={16} /></button>
          <Link className="icon-btn" href="/settings" aria-label="Settings"><Settings2 size={16} /></Link>
        </div>
      </header>
      <main className="content"><VersionNotice />{children}</main>
      <footer className="footer"><span>ARC / ETHEREUM RESEARCH TERMINAL</span><span>Chain metrics stay blank until logs are indexed</span></footer>
    </div>
    {open && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
  </div>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  return <WorkspaceProvider><Frame>{children}</Frame></WorkspaceProvider>;
}

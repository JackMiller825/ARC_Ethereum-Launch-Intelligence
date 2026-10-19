"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveLookup } from '@/lib/research/lookup';
import { useWorkspace } from './workspace';

const commands = [
  { label: 'Analyze token', href: '/analysis' },
  { label: 'Analyze wallet', href: '/wallets' },
  { label: 'Open Brand Intelligence', href: '/brand-intelligence?mode=future' },
  { label: 'Open Launch Laboratory', href: '/laboratory' },
  { label: 'Compare tokens', href: '/history' },
  { label: 'Open Launch Planner', href: '/planner' },
  { label: 'View saved reports', href: '/history' },
  { label: 'Open Help Center', href: '/help' },
];

export function CommandPalette() {
  const router = useRouter();
  const { snapshots } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const tokens = useMemo(() => snapshots.map((item) => ({ address: item.token.address, symbol: item.token.symbol, name: item.token.name })), [snapshots]);
  const lookup = resolveLookup(query, tokens);
  if (!open) return null;
  function go(href: string) {
    setOpen(false);
    setQuery('');
    router.push(href);
  }
  return <div className="palette-backdrop" role="presentation" onClick={() => setOpen(false)}><div className="palette" role="dialog" aria-label="Research commands" onClick={(event) => event.stopPropagation()}><input aria-label="Command search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Contract, saved token, or command" autoFocus />{lookup.kind === 'token' && <button type="button" onClick={() => go(`/analysis?ca=${lookup.address}`)}>Open saved token</button>}{lookup.kind === 'address' && <><button type="button" onClick={() => go(`/analysis?ca=${lookup.address}`)}>Analyze as a token contract</button><button type="button" onClick={() => go(`/wallets?address=${lookup.address}`)}>Look for this signer in saved indexes</button></>}{lookup.kind === 'many' && lookup.tokens.map((token) => <button key={token.address} type="button" onClick={() => go(`/analysis?ca=${token.address}`)}>{token.symbol} · {token.name}</button>)}{lookup.kind === 'text' && <button type="button" onClick={() => go(`/history?q=${encodeURIComponent(lookup.query)}`)}>Search saved tokens for “{lookup.query}”</button>}{commands.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase())).map((item) => <button key={item.label} type="button" onClick={() => go(item.href)}>{item.label}</button>)}</div></div>;
}

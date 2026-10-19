"use client";
import { ArrowRight, Search, ShieldCheck } from './icons';

const NODES = [
  { id: 'liquidity', label: 'Liquidity Scanner', x: 92, y: 36 },
  { id: 'bots', label: 'Bot Intelligence', x: 292, y: 36 },
  { id: 'wallets', label: 'Wallet Forensics', x: 300, y: 120 },
  { id: 'flow', label: 'Capital Flow', x: 292, y: 204 },
  { id: 'overview', label: 'Launch Analysis', x: 92, y: 204 },
  { id: 'quality', label: 'Risk Signals', x: 80, y: 120 },
] as const;

export function IntelligenceNetwork({ onPick }: { onPick?: (id: string) => void }) {
  return (
    <div className="network-visual" aria-hidden={onPick ? undefined : true}>
      <svg viewBox="0 0 380 240" className="network-svg" role="img" aria-label="ARC intelligence map">
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C084FC" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#8B5CF6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="linkGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#C4B5FD" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        {NODES.map((node) => (
          <line key={node.id} x1="190" y1="120" x2={node.x} y2={node.y} stroke="url(#linkGrad)" strokeWidth="1.2" />
        ))}
        <circle className="scan-ring" cx="190" cy="120" r="54" fill="none" stroke="rgba(196,181,253,.35)" />
        <circle cx="190" cy="120" r="36" fill="url(#coreGlow)" />
        <circle cx="190" cy="120" r="18" fill="#17172F" stroke="#C4B5FD" strokeWidth="1.4" />
        <text x="190" y="124" textAnchor="middle" fill="#F8F7FF" fontSize="8" fontFamily="JetBrains Mono, monospace">ARC</text>
        <text x="190" y="156" textAnchor="middle" fill="#C4B5FD" fontSize="9" fontFamily="JetBrains Mono, monospace">Intelligence Core</text>
      </svg>
      {NODES.map((node) => (
        <button
          key={node.id}
          type="button"
          className="net-node"
          style={{ left: `${(node.x / 380) * 100}%`, top: `${(node.y / 240) * 100}%` }}
          onClick={() => onPick?.(node.id)}
        >
          {node.label}
        </button>
      ))}
    </div>
  );
}

export function ContractSearchHero({
  value,
  onChange,
  onSubmit,
  busy,
  onNode,
  recent,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
  onNode?: (id: string) => void;
  recent?: string[];
}) {
  return (
    <section className="search-hero">
      <div className="search-hero-copy">
        <div className="feature-kicker"><span className="live-dot" /> ETHEREUM INTELLIGENCE ENGINE</div>
        <h2>Decode Every Launch.</h2>
        <p>Investigate real trading activity, automated strategies, liquidity movements, and the wallets behind every Ethereum token.</p>
        <form className="hero-search" data-tour="ca-search" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
          <Search size={18} />
          <input aria-label="Ethereum token contract address" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Paste an Ethereum contract address" spellCheck={false} />
          <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Indexing…' : 'Analyze Token'} <ArrowRight size={15} /></button>
        </form>
        <div className="hero-meta">
          <span className="network-pill"><span className="pulse-dot" /> Ethereum Mainnet</span>
          <span><ShieldCheck size={14} /> Live on-chain verification</span>
        </div>
        {recent && recent.length > 0 && <div className="recent-row">{recent.slice(0, 4).map((item) => <button key={item} type="button" className="pill" onClick={() => { onChange(item); }}>{item.slice(0, 6)}…{item.slice(-4)}</button>)}</div>}
      </div>
      <IntelligenceNetwork onPick={onNode} />
    </section>
  );
}

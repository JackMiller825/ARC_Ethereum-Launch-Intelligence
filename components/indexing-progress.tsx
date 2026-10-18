"use client";
import type { ProgressUpdate } from '@/lib/types';

const ORDER = ['Start', 'RPC', 'Metadata', 'Pools', 'T0', 'Window', 'Indexing', 'Reconstruction', 'Classification', 'Analytics'];

const STEPS: { label: string; stages: string[] }[] = [
  { label: 'Validate the contract address', stages: ['Start', 'RPC'] },
  { label: 'Retrieve token identity', stages: ['Metadata'] },
  { label: 'Discover liquidity pools', stages: ['Pools'] },
  { label: 'Index on-chain swaps', stages: ['T0', 'Window', 'Indexing'] },
  { label: 'Reconstruct buy and sell trades', stages: ['Reconstruction'] },
  { label: 'Analyze wallet behavior', stages: ['Reconstruction'] },
  { label: 'Classify automated patterns', stages: ['Classification'] },
  { label: 'Display analytics and coverage', stages: ['Analytics'] },
];

function rank(stage: string) {
  const index = ORDER.indexOf(stage);
  return index < 0 ? 0 : index;
}

export function IndexingProgress({ progress, onCancel }: { progress: ProgressUpdate; onCancel: () => void }) {
  const here = rank(progress.stage);
  return <section className="panel" aria-live="polite">
    <div className="panel-eyebrow">INDEXER</div>
    <h3>{progress.stage}</h3>
    <p className="panel-desc">{progress.detail}</p>
    <ol className="stage-list">
      {STEPS.map((step) => {
        const stepRank = Math.min(...step.stages.map(rank));
        const last = Math.max(...step.stages.map(rank));
        const state = here > last ? 'done' : here >= stepRank ? 'current' : 'waiting';
        return <li key={step.label} className={`stage-${state}`}><span>{state === 'done' ? 'Done' : state === 'current' ? 'Now' : '—'}</span>{step.label}</li>;
      })}
    </ol>
    <div className="coverage-row"><span>Blocks scanned</span><strong>{progress.blocksScanned ?? '—'}</strong><span>Remaining</span><strong>{progress.blocksRemaining ?? '—'}</strong><span>Pools</span><strong>{progress.pools ?? '—'}</strong><span>Swaps</span><strong>{progress.swaps ?? '—'}</strong></div>
    <p className="panel-desc">The {progress.pct}% figure is the indexer’s own completed-work marker for this stage. It is not a timer. {progress.provisional ? 'Unresolved gaps stay visible.' : 'No synthetic trades are inserted if a read fails.'}</p>
    {(progress.errors || []).map((error) => <p className="error-note" key={error}>{error}</p>)}
    <div className="feature-actions"><button className="btn ghost" type="button" onClick={onCancel}>Cancel</button><span className="small-muted">Submit the address again to retry. A canceled run is not replaced with estimates.</span></div>
  </section>;
}

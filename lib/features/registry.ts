import type { Availability } from '../help/articles';

export type FeatureDefinition = {
  id: string;
  name: string;
  description: string;
  route: string;
  status: Availability;
  supportedModes: string[];
  sources: string[];
  helpArticleId: string;
  glossaryIds: string[];
  relatedFeatureIds: string[];
  lastReviewed: string;
};

export const FEATURES: FeatureDefinition[] = [
  { id: 'overview', name: 'Overview', description: 'Neutral start. A contract or a future name is entered by the user.', route: '/', status: 'available', supportedModes: ['existing', 'future'], sources: ['app/page.tsx'], helpArticleId: 'getting-started', glossaryIds: ['gross-buy', 'net-flow', 'coverage'], relatedFeatureIds: ['analyzer', 'brand'], lastReviewed: '2026-10-19' },
  { id: 'analyzer', name: 'Token Analyzer', description: 'Indexes one ERC-20 from a pasted address.', route: '/analysis', status: 'available', supportedModes: ['existing'], sources: ['app/analysis/page.tsx', 'components/visual.tsx', 'lib/chain/analyze.ts'], helpArticleId: 'token-analyzer', glossaryIds: ['gross-buy', 'gross-sell', 'automated-buy', 'buyers'], relatedFeatureIds: ['brand', 'coverage'], lastReviewed: '2026-10-19' },
  { id: 'brand', name: 'Name & Ticker Analyzer', description: 'Editorial name and ticker rubric for up to 20 candidates. A contract is optional. Recognition rates use saved responses only.', route: '/brand-intelligence', status: 'available', supportedModes: ['existing', 'future', 'compare'], sources: ['app/brand-intelligence/page.tsx', 'lib/brand/score.ts', 'lib/brand/candidates.ts', 'lib/brand/recognition.ts', 'components/recognition-lab.tsx'], helpArticleId: 'brand-intelligence', glossaryIds: ['brand-score', 'brand-coverage', 'brand-risk', 'recognition'], relatedFeatureIds: ['analyzer', 'planner'], lastReviewed: '2026-10-19' },
  { id: 'planner', name: 'Launch Planner', description: 'Checklist and hypothetical liquidity math. Not a forecast.', route: '/planner', status: 'limited', supportedModes: ['future'], sources: ['app/planner/page.tsx', 'lib/research/readiness.ts'], helpArticleId: 'launch-planner', glossaryIds: ['readiness'], relatedFeatureIds: ['brand', 'history'], lastReviewed: '2026-10-19' },
  { id: 'bots', name: 'Bot Intelligence', description: 'Evidence classes for the open snapshot.', route: '/bots', status: 'available', supportedModes: ['existing'], sources: ['app/bots/page.tsx', 'lib/chain/heuristics.ts'], helpArticleId: 'bot-intelligence', glossaryIds: ['classification', 'automated-buy'], relatedFeatureIds: ['analyzer'], lastReviewed: '2026-10-18' },
  { id: 'wallets', name: 'Wallet Explorer', description: 'Signer drill-down for the open snapshot.', route: '/wallets', status: 'available', supportedModes: ['existing'], sources: ['app/wallets/page.tsx'], helpArticleId: 'wallet-explorer', glossaryIds: ['buyers'], relatedFeatureIds: ['analyzer'], lastReviewed: '2026-10-19' },
  { id: 'history', name: 'Token History', description: 'Saved snapshots in this browser. Nothing is preloaded.', route: '/history', status: 'available', supportedModes: ['existing'], sources: ['app/history/page.tsx'], helpArticleId: 'token-history', glossaryIds: [], relatedFeatureIds: ['analyzer', 'brand'], lastReviewed: '2026-10-19' },
    { id: 'settings', name: 'Data & Settings', description: 'RPC list, demo switch, brand auto-score, and documentation coverage. Demo is off. The hosted site does not run the worker.', route: '/settings', status: 'limited', supportedModes: ['settings'], sources: ['app/settings/page.tsx', 'components/coverage-panel.tsx'], helpArticleId: 'rpc', glossaryIds: ['coverage'], relatedFeatureIds: ['analyzer'], lastReviewed: '2026-10-19' },
  { id: 'help', name: 'Help & Documentation', description: 'Local articles generated from the same feature list.', route: '/help', status: 'available', supportedModes: ['help'], sources: ['app/help/page.tsx', 'lib/help/articles.ts'], helpArticleId: 'getting-started', glossaryIds: [], relatedFeatureIds: ['overview'], lastReviewed: '2026-10-19' },
  { id: 'intervals', name: 'Time intervals', description: 'Launch, rolling, and absolute windows from 1 minute through 30 days.', route: '/analysis', status: 'available', supportedModes: ['existing'], sources: ['lib/intervals.ts', 'components/ui.tsx'], helpArticleId: 'intervals', glossaryIds: ['coverage'], relatedFeatureIds: ['analyzer'], lastReviewed: '2026-10-18' },
  { id: 'coverage', name: 'Coverage', description: 'How a log becomes a dashboard figure.', route: '/analysis', status: 'available', supportedModes: ['existing'], sources: ['lib/analytics/coverage.ts'], helpArticleId: 'coverage', glossaryIds: ['coverage'], relatedFeatureIds: ['analyzer'], lastReviewed: '2026-10-18' },
  { id: 'laboratory', name: 'Launch Laboratory', description: 'Replay stored swaps at a shared cutoff and run a labeled constant-product simulation.', route: '/laboratory', status: 'available', supportedModes: ['existing'], sources: ['app/laboratory/page.tsx', 'lib/research/replay.ts', 'lib/research/simulate.ts'], helpArticleId: 'launch-laboratory', glossaryIds: ['replay', 'simulation', 'research-quality'], relatedFeatureIds: ['analyzer', 'history'], lastReviewed: '2026-10-19' },
  { id: 'assistant', name: 'Research Assistant', description: 'Rule answers from the open snapshot. No model is configured on the published site.', route: '/analysis', status: 'limited', supportedModes: ['existing', 'future'], sources: ['components/assistant.tsx', 'lib/research/assistant.ts'], helpArticleId: 'research-assistant', glossaryIds: ['research-quality'], relatedFeatureIds: ['analyzer', 'brand'], lastReviewed: '2026-10-19' },
  { id: 'docs', name: 'Documentation Coverage', description: 'Counts features whose Help article, availability, and glossary links match the registry.', route: '/help', status: 'available', supportedModes: ['help'], sources: ['lib/features/coverage.ts', 'components/coverage-panel.tsx'], helpArticleId: 'documentation-coverage', glossaryIds: [], relatedFeatureIds: ['help', 'settings'], lastReviewed: '2026-10-19' },
];

export function featureById(id: string) {
  return FEATURES.find((feature) => feature.id === id);
}

export const RUBRIC_VERSION = 'arc-brand-v1';

export const CATEGORY_IDS = [
  'first-impression',
  'name-quality',
  'ticker-quality',
  'meme-power',
  'narrative',
  'originality',
  'brand-identity',
  'social',
  'audience',
  'risk',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];
export type BrandMode = 'existing' | 'future' | 'historical';
export type AssessmentStatus = 'scored' | 'insufficient' | 'unknown';
export type EvidenceClass = 'deterministic' | 'editorial-rubric' | 'directory' | 'live-source' | 'user-supplied';
export type Sufficiency = 'high' | 'medium' | 'low' | 'none';
export type ProfileId = 'balanced' | 'trader' | 'meme' | 'long-term' | 'global' | 'custom';

export type CategoryWeights = Record<CategoryId, number>;

export type BrandLinks = { website?: string; telegram?: string; x?: string };

export type BrandInput = {
  name: string;
  ticker: string;
  narrative?: string;
  memeOrigin?: string;
  mascot?: string;
  audience?: string;
  ethereumRelevance?: string;
  keywords?: string[];
  links?: BrandLinks;
  imageryDescribed?: boolean;
  mode: BrandMode;
  address?: string;
  metadataSource?: string;
  contextNote?: string;
  linkedAddress?: string;
  analyzedAt?: number;
};

export type CriterionDefinition = {
  id: string;
  categoryId: CategoryId;
  title: string;
  explanation: string;
  rubric: string;
  weight: number;
  method: 'deterministic' | 'editorial-rubric' | 'research';
};

export type CriterionAssessment = {
  id: string;
  score: number | null;
  status: AssessmentStatus;
  weight: number;
  evidence: EvidenceClass;
  sufficiency: Sufficiency;
  rationale: string;
  advice: string;
  riskSeverity: number | null;
  source: string | null;
};

export type CategoryScore = {
  id: CategoryId;
  title: string;
  weight: number;
  score: number | null;
  coverage: number;
  label: string;
};

export type CollisionMatchType =
  | 'exact-name'
  | 'exact-ticker'
  | 'normalized'
  | 'spelling'
  | 'phonetic'
  | 'abbreviation'
  | 'word-order'
  | 'alias'
  | 'thematic';

export type CollisionFinding = {
  id: string;
  matchedName: string;
  matchedTicker: string;
  source: string;
  address?: string;
  chain?: string;
  matchType: CollisionMatchType;
  similarity: number;
  url?: string;
  observedAt: number;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
};

export type ResearchSource = {
  id: string;
  status: 'not-run' | 'ok' | 'unavailable';
  note: string;
  checkedAt: number | null;
};

export type BrandAnalysis = {
  id: string;
  candidateId: string;
  rubricVersion: typeof RUBRIC_VERSION;
  input: BrandInput;
  profileId: ProfileId;
  weights: CategoryWeights;
  criteria: CriterionAssessment[];
  categories: CategoryScore[];
  overall: number | null;
  label: string;
  coverage: number;
  collisions: CollisionFinding[];
  research: { scope: string; sources: ResearchSource[] };
  limitations: string[];
  analyzedAt: number;
};

export type ImprovementSuggestion = {
  id: string;
  name: string;
  ticker: string;
  meaning: string;
  why: string;
  changed: string;
  strengths: string[];
  weaknesses: string[];
  collisions: CollisionFinding[];
  categoryDeltas: { id: CategoryId; title: string; delta: number | null }[];
  overall: number | null;
  coverage: number;
  disclaimer: string;
};

export type ComparisonRow = {
  rank: number;
  candidateId: string;
  name: string;
  ticker: string;
  overall: number | null;
  coverage: number;
  label: string;
  categories: CategoryScore[];
  collisions: CollisionFinding[];
  analysis: BrandAnalysis;
  warning: string;
};

export type ComparisonSession = {
  id: string;
  rubricVersion: typeof RUBRIC_VERSION;
  profileId: ProfileId;
  weights: CategoryWeights;
  rows: ComparisonRow[];
  rankingNote: string;
  createdAt: number;
};

export type BrandReport = {
  title: string;
  summary: string[];
  advanced: string[];
  limitations: string[];
};

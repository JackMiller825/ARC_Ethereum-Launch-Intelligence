export type Interval = '1m' | '3m' | '5m' | '10m' | '15m' | '30m' | '1h' | '2h' | '3h' | '6h' | '12h' | '24h' | '3d' | '7d' | '14d' | '30d' | 'custom';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type Protocol = 'v2' | 'v3' | 'v4';
export type Valuation = 'weth-pool' | 'multihop-weth' | 'unsupported';
export type BotClass = 'Sniper' | 'New-pair scanner' | 'Copy-trading' | 'Momentum' | 'Arbitrage' | 'Sandwich' | 'MEV' | 'Market-maker' | 'Unknown';

export type Token = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  launch: string;
  status: string;
  initialEth: number | null;
  holders: number | null;
  source: 'demo' | 'blockscout' | 'chain';
  verified?: boolean;
  deployer?: string | null;
};

export type Trade = {
  id: string;
  minute: number;
  timestamp: number;
  wallet: string;
  recipient: string;
  side: 'BUY' | 'SELL';
  eth: number | null;
  ethWei: string | null;
  tokenAmount: string;
  classification: BotClass | string;
  confidence: Confidence;
  evidence: string[];
  /** Ordinal evidence weight for the bar. Not a probability. */
  score: number;
  method: string;
  isProject: boolean;
  exclusionReason?: string;
  assistedExecution: boolean;
  valuation: Valuation;
  protocol: Protocol | 'demo';
  pool: string;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  txIndex: number;
  origin: 'chain' | 'demo';
  gas?: string | null;
  maxPriorityFeePerGas?: string | null;
};

export type WindowMode = 'launch' | 'trailing' | 'absolute';
export type WindowSpec =
  | { mode: 'launch'; minutes: number }
  | { mode: 'trailing'; minutes: number }
  | { mode: 'absolute'; startIso: string; endIso: string; minutes: number };

export type PoolInfo = {
  protocol: Protocol;
  address: string;
  poolId?: string;
  token0: string;
  token1: string;
  quote: string;
  fee?: number;
  discovery: string;
  factory?: string;
};

export type AuditEvent = {
  kind: 'mint' | 'burn' | 'project-trade' | 'same-tx-lp' | 'note';
  txHash: string;
  blockNumber: number;
  logIndex: number;
  reason: string;
  wallet?: string;
};

export type Kpis = {
  grossBuyWei: string;
  grossSellWei: string;
  botBuyWei: string;
  botSellWei: string;
  otherBuyWei: string;
  netWei: string;
  botBuyShare: number | null;
  bands: { highWei: string; mediumWei: string; lowWei: string; unknownWei: string };
  buyCount: number;
  sellCount: number;
  uniqueBuyers: number;
  uniqueSellers: number;
  uniqueActors: number;
  firstBlockBuyers: number;
  failedSwaps: null;
  failedSwapsReason: string;
  priceImpactBps: number | null;
  initialLiquidityWei: string | null;
  lpEvents: number;
  buyerRetention: number | null;
  concentrationTop5: number | null;
  unsupportedValuationPct: number;
  excludedProjectWei: string;
  turnover: number | null;
};

export type CoverageItem = { id: string; label: string; state: 'done' | 'partial' | 'unavailable'; detail: string };

export type Coverage = {
  items: CoverageItem[];
  headBlock: number;
  fromBlock: number;
  toBlock: number;
  indexedAt: number;
  heuristicVersion: string;
  logSource: string;
  reconciliation: { rawSwapLogs: number; economicTrades: number; poolWethWei: string; economicWethWei: string; matched: boolean };
  tipHash: string;
  /** Present on analyses produced after phase 2. Older snapshots omit it. */
  pct?: number;
  provisional?: boolean;
};

export type TimelineMark = {
  deployTimestamp: number | null;
  poolCreateTimestamp: number | null;
  firstLiquidityTimestamp: number | null;
  t0Timestamp: number | null;
  t0Block: number | null;
  t0Tx: string | null;
  t0LogIndex: number | null;
};

export type AnalysisSuccess = {
  ok: true;
  origin: 'chain';
  token: Token;
  pools: PoolInfo[];
  timeline: TimelineMark;
  trades: Trade[];
  audit: AuditEvent[];
  kpis: Kpis;
  coverage: Coverage;
  window: WindowSpec;
  warnings: string[];
  projectWallets: { address: string; reason: string }[];
  savedAt: number;
};

export type AnalysisUnavailable = {
  ok: false;
  origin: 'unavailable';
  address: string;
  reason: string;
  warnings: string[];
};

export type AnalysisResult = AnalysisSuccess | AnalysisUnavailable;
export type ProgressUpdate = {
  stage: string;
  detail: string;
  pct: number;
  blocksScanned?: number;
  targetBlocks?: number;
  pools?: number;
  swaps?: number;
  coveragePct?: number;
  provisional?: boolean;
  skipped?: number;
  errors?: string[];
  blocksRemaining?: number;
  routes?: number;
  wallets?: number;
  retries?: number;
  missingRanges?: number;
  elapsedMs?: number;
  swapsPerSecond?: number;
};
export type Metric = { name: string; value: string; change: string; direction?: 'up' | 'down' | 'flat' };

export type Playbook = {
  id: string;
  name: string;
  regime: string;
  tokenAddress: string;
  openEnded: boolean;
  initialEth: number;
  grossBuyGoal: number;
  botShare: number;
  botSellRatio: number;
  windowMinutes: number;
  tokenName: string;
  ticker: string;
  plannedAddress: string;
  tokenToLp: string;
  poolType: 'v2' | 'v3' | 'v4';
  expectedStart: string;
  plannedSupply: string;
  qualityThreshold: number;
  operationalBudget: number;
  completed: string[];
  milestones: { id: string; label: string; note: string }[];
  updatedAt: number;
};

export type ComparisonGroup = { id: string; name: string; addresses: string[] };

export type LibraryCatalog = {
  favorites: string[];
  recents: string[];
  groups: ComparisonGroup[];
};

export type RefreshMode = 'manual' | 'block' | '15' | '30' | '60' | '300';

export type AppSettings = {
  rpcUrls: string[];
  blockscoutBase: string;
  demoMode: boolean;
  refreshMode: RefreshMode;
  alertBuyEth: number;
  alertSellEth: number;
  coverageFloor: number;
};

export type WalletLabel = { address: string; role: 'project' | 'independent'; note: string };

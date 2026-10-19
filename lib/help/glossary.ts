export type GlossaryEntry = {
  id: string;
  title: string;
  summary: string;
  formula: string;
  limitation: string;
  article: string;
};

export const GLOSSARY: Record<string, GlossaryEntry> = {
  'gross-buy': {
    id: 'gross-buy',
    title: 'Gross ETH buy volume',
    summary: 'Sum of valued independent buys. Each WETH hop is counted once. Units are ETH, computed in wei.',
    formula: 'gross buy = Σ valued independent buy wei ÷ 10^18',
    limitation: 'Swaps without a reconstructable WETH hop stay unvalued and are excluded. This is not net demand.',
    article: 'metrics',
  },
  'gross-sell': {
    id: 'gross-sell',
    title: 'Gross ETH sell volume',
    summary: 'Sum of valued independent sells. Project-labeled wallets and liquidity burns are excluded.',
    formula: 'gross sell = Σ valued independent sell wei ÷ 10^18',
    limitation: 'A large gross sell can coexist with a large gross buy. Compare net flow before reading it as an exit.',
    article: 'metrics',
  },
  'net-flow': {
    id: 'net-flow',
    title: 'Net ETH flow',
    summary: 'Valued independent buys minus valued independent sells in the selected window.',
    formula: 'net = gross buy wei − gross sell wei',
    limitation: 'The same ETH can turn over, so gross volume can be much larger than net flow.',
    article: 'metrics',
  },
  'automated-buy': {
    id: 'automated-buy',
    title: 'Automated buy estimate',
    summary: 'Valued independent buys whose evidence is HIGH or MEDIUM under arc-heuristic-v2.',
    formula: 'automated buy = Σ buy wei where confidence ∈ {HIGH, MEDIUM}',
    limitation: 'LOW and UNKNOWN stay out. The label is evidence, not a probability and not a person.',
    article: 'bot-intelligence',
  },
  'automated-sell': {
    id: 'automated-sell',
    title: 'Automated sell estimate',
    summary: 'Valued independent sells in the same HIGH and MEDIUM evidence bands.',
    formula: 'automated sell = Σ sell wei where confidence ∈ {HIGH, MEDIUM}',
    limitation: 'An EOA that calls a router is assisted execution, not proof of an autonomous bot.',
    article: 'bot-intelligence',
  },
  buyers: {
    id: 'buyers',
    title: 'Unique buying wallets',
    summary: 'Count of distinct signer addresses with at least one independent buy in the window.',
    formula: 'buyers = |{ signer | independent buy }|',
    limitation: 'One person can use many addresses, and one address can be shared. This is not a count of humans.',
    article: 'metrics',
  },
  liquidity: {
    id: 'liquidity',
    title: 'Active liquidity',
    summary: 'ETH-side liquidity reconstructed from the first relevant mint when the logs support it.',
    formula: 'Shown in ETH from the stored initial liquidity wei. LP event count is separate.',
    limitation: 'V3 and V4 concentrated liquidity is not fully reconstructed by the V2 constant-product what-if.',
    article: 'metrics',
  },
  coverage: {
    id: 'coverage',
    title: 'Coverage confidence',
    summary: 'Share of the requested work the indexer could finish. Warnings, caps, and reconciliation gaps keep it under 100%.',
    formula: 'Reported by the coverage scorer from completed reads, missing ranges, and warnings.',
    limitation: 'A high percentage is not a claim that every bot label is correct.',
    article: 'coverage',
  },
  classification: {
    id: 'classification',
    title: 'Bot classification',
    summary: 'An ordinal evidence class: sniper, scanner, copy, momentum, arbitrage, sandwich, MEV, market-maker, or unknown.',
    formula: 'HIGH and MEDIUM enter the automated total. LOW, including market-making hints, stays out.',
    limitation: 'ARC cannot name a human operator from on-chain behavior alone.',
    article: 'bot-intelligence',
  },
  'brand-score': {
    id: 'brand-score',
    title: 'Editorial quality score',
    summary: 'Weighted average of the rubric factors that had enough information, on a 0–10 scale.',
    formula: 'score = Σ (factor score × category weight × factor weight) ÷ Σ weights of scored factors',
    limitation: 'This is not a probability of market success. Below 40% coverage the overall number is withheld.',
    article: 'brand-intelligence',
  },
  'brand-coverage': {
    id: 'brand-coverage',
    title: 'Assessment coverage',
    summary: 'The share of the weighted rubric that could be scored from the text and sources you actually have.',
    formula: 'coverage = scored weight ÷ total rubric weight',
    limitation: 'A missing narrative lowers coverage. It does not become a zero for those factors.',
    article: 'brand-intelligence',
  },
  'brand-risk': {
    id: 'brand-risk',
    title: 'Collision and risk findings',
    summary: 'Separate records of name or ticker matches and severity. Higher severity lowers the quality score.',
    formula: 'quality = 10 − severity, for risk factors that are scored',
    limitation: 'The bundled list and any live directory that responded are the scope. No match is not a trademark clearance.',
    article: 'brand-intelligence',
  },
  'research-quality': {
    id: 'research-quality',
    title: 'Research completeness',
    summary: 'A score of how much of the indexed window could be reconstructed. It is not a safety rating.',
    formula: 'mean of block coverage, pool presence, reconciliation, valuation completeness, and a capped finality term',
    limitation: 'A high score does not mean the token is safe or that the head block is finalized.',
    article: 'launch-laboratory',
  },
  replay: {
    id: 'replay',
    title: 'Launch replay',
    summary: 'Playback of swaps already stored for one saved token, in block order.',
    formula: 'cursor walks the stored trade list; no row is synthesized',
    limitation: 'A minute with no valued swap is omitted. Playback speed changes the cursor interval only. Seek does not invent the trades between stored rows.',
    article: 'launch-laboratory',
  },
  simulation: {
    id: 'simulation',
    title: 'Constant-product simulation',
    summary: 'Hypothetical Uniswap V2 output and impact for reserves you type.',
    formula: 'amountOut = amountInWithFee × reserveOut ÷ (reserveIn × 10000 + amountInWithFee), fee 30 bps unless stated',
    limitation: 'This is not recorded market history. V3 and V4 concentrated liquidity are not simulated with this curve.',
    article: 'launch-laboratory',
  },
  recognition: {
    id: 'recognition',
    title: 'Recognition response',
    summary: 'A name, ticker, and meaning typed after a five-second exposure that a person consented to.',
    formula: 'exact name = matching trimmed responses ÷ completed responses; ticker and meaning are counted separately',
    limitation: 'Empty storage has no rate. A small sample is not a significance claim. Imported CSV rows stay labeled imported. This browser is not a multi-person study.',
    article: 'brand-intelligence',
  },
  readiness: {
    id: 'readiness',
    title: 'Launch readiness',
    summary: 'Operational states for brand, contract, liquidity, RPC, monitoring, and post-launch export.',
    formula: 'ready, needs review, blocked, or not assessed, from inputs that are actually present',
    limitation: 'Ready is not a prediction of buyers, price, or a permission audit.',
    article: 'launch-planner',
  },
};

export function glossaryEntry(id: string) {
  return GLOSSARY[id];
}

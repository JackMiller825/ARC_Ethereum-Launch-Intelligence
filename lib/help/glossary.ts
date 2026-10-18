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
};

export function glossaryEntry(id: string) {
  return GLOSSARY[id];
}

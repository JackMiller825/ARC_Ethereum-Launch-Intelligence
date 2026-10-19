import type { Trade, Token, Interval } from './types';
import { durations, filterTrades } from './intervals';
import { ordinalScore, shortAddr } from './format';
import { computeKpis } from './chain/kpis';

export { durations, shortAddr, filterTrades };

/** Layout-only cards. Rendered only while Settings demo mode is on. Not a saved history and not a chain read. */
export const sampleTokens: Token[] = [
  { address: '0x1111111111111111111111111111111111111111', name: 'Example Alpha', symbol: 'ALPHA', decimals: 18, launch: '', status: 'Synthetic example', initialEth: null, holders: null, source: 'demo' },
  { address: '0x2222222222222222222222222222222222222222', name: 'Example Beta', symbol: 'BETA', decimals: 18, launch: '', status: 'Synthetic example', initialEth: null, holders: null, source: 'demo' },
];

const classes = ['Sniper', 'New-pair scanner', 'Copy-trading', 'Momentum', 'Arbitrage', 'Unknown', 'Unknown'] as const;
export const syntheticTrades: Trade[] = Array.from({ length: 140 }, (_, i) => {
  const side: 'BUY' | 'SELL' = i % 7 < 5 ? 'BUY' : 'SELL';
  const minute = (i * 13 + (i * i) % 31) % 120;
  const classification = classes[(i * 11 + i % 5) % classes.length];
  const confidence = classification === 'Unknown' ? 'UNKNOWN' as const : classification === 'Arbitrage' ? 'MEDIUM' as const : 'LOW' as const;
  const eth = Number((0.035 + (i % 17) * 0.017 + (i % 9) * 0.011).toFixed(3));
  return {
    id: `demo-${i + 1}`,
    minute,
    timestamp: 0,
    wallet: `0x${(23000 + i * 73).toString(16).padStart(40, '0')}`,
    recipient: `0x${(23000 + i * 73).toString(16).padStart(40, '0')}`,
    side,
    eth,
    ethWei: BigInt(Math.round(eth * 1e18)).toString(),
    tokenAmount: '0',
    classification,
    confidence,
    evidence: ['Synthetic fixture for layout preview. This row is not a chain event.'],
    score: ordinalScore(confidence),
    method: i % 3 ? 'Demo router' : 'Demo aggregator',
    isProject: i === 4 || i === 23,
    assistedExecution: false,
    valuation: 'weth-pool',
    protocol: 'demo',
    pool: 'demo',
    txHash: `0x${(i + 1).toString(16).padStart(64, '0')}`,
    logIndex: i,
    blockNumber: 0,
    txIndex: i,
    origin: 'demo',
  };
});

export function selectTrades(min: number, mode: 'launch' | 'recent' = 'launch') {
  return syntheticTrades.filter((trade) => mode === 'recent' ? trade.minute >= Math.max(0, 120 - min) : trade.minute < min);
}

export function aggregate(trades: Trade[]) {
  const kpis = computeKpis(trades, { initialLiquidityWei: null, lpEvents: 0, t0Block: null });
  const buys = Number(kpis.grossBuyWei) / 1e18;
  const sells = Number(kpis.grossSellWei) / 1e18;
  const botBuys = Number(kpis.botBuyWei) / 1e18;
  return { buys, sells, botBuys, buyCount: kpis.buyCount, sellCount: kpis.sellCount, botCount: trades.filter((trade) => !trade.isProject && trade.side === 'BUY' && (trade.confidence === 'HIGH' || trade.confidence === 'MEDIUM')).length, buyers: kpis.uniqueBuyers, net: buys - sells, botShare: kpis.botBuyShare || 0 };
}

export function intervalMinutes(interval: Interval, custom: number) {
  return interval === 'custom' ? custom : durations[interval];
}

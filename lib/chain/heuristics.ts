import { HEURISTIC_VERSION } from './constants';
import { ordinalScore, sameAddr } from '../format';
import type { Confidence, Trade } from '../types';

export { HEURISTIC_VERSION };

type Context = {
  t0Block: number | null;
  contracts: Set<string>;
  priorLaunches: Map<string, string[]>;
};

const weight: Record<Confidence, number> = { HIGH: 4, MEDIUM: 3, LOW: 2, UNKNOWN: 1 };

function bump(current: Confidence, next: Confidence) {
  return weight[next] > weight[current] ? next : current;
}

export function classifyTrades(trades: Trade[], ctx: Context): Trade[] {
  const sorted = trades.slice().sort((a, b) => a.blockNumber - b.blockNumber || a.txIndex - b.txIndex || a.logIndex - b.logIndex);
  const followCount = new Map<string, number>();
  const buys = sorted.filter((trade) => trade.side === 'BUY' && !trade.isProject);
  for (let i = 0; i < buys.length; i++) {
    const trade = buys[i];
    const leader = buys.slice(Math.max(0, i - 8), i).reverse().find((item) => item.blockNumber >= trade.blockNumber - 2 && !sameAddr(item.wallet, trade.wallet));
    if (!leader) continue;
    const key = `${trade.wallet.toLowerCase()}->${leader.wallet.toLowerCase()}`;
    followCount.set(key, (followCount.get(key) || 0) + 1);
  }
  const byWallet = new Map<string, Trade[]>();
  for (const trade of sorted) {
    const key = trade.wallet.toLowerCase();
    byWallet.set(key, [...(byWallet.get(key) || []), trade]);
  }
  const sandwich = new Set<string>();
  const byBlock = new Map<number, Trade[]>();
  for (const trade of sorted) byBlock.set(trade.blockNumber, [...(byBlock.get(trade.blockNumber) || []), trade]);
  for (const blockTrades of byBlock.values()) {
    const ordered = blockTrades.slice().sort((a, b) => a.txIndex - b.txIndex);
    for (const attack of ordered) {
      if (attack.side !== 'BUY') continue;
      const sell = ordered.find((item) => item.side === 'SELL' && sameAddr(item.wallet, attack.wallet) && item.txIndex > attack.txIndex);
      if (!sell) continue;
      const victim = ordered.some((item) => item.side === 'BUY' && !sameAddr(item.wallet, attack.wallet) && item.txIndex > attack.txIndex && item.txIndex < sell.txIndex);
      if (victim) sandwich.add(attack.id);
    }
  }

  return sorted.map((trade) => {
    const evidence = [...trade.evidence];
    let confidence: Confidence = 'UNKNOWN';
    let classification = 'Unknown';
    const mine = byWallet.get(trade.wallet.toLowerCase()) || [];
    const isContract = ctx.contracts.has(trade.wallet.toLowerCase());
    const prior = ctx.priorLaunches.get(trade.wallet.toLowerCase()) || [];
    if (isContract) evidence.push('Signer has contract code. That shows automated infrastructure, not who controls it.');
    if (prior.length) evidence.push(`Wallet appeared in saved launches: ${prior.join(', ')}.`);
    if (trade.assistedExecution && !isContract) evidence.push('Signer is an EOA that called a public router. A person can submit that through a bot interface, so this is assisted execution, not proof of an autonomous decision.');
    if (ctx.t0Block !== null && trade.side === 'BUY' && trade.blockNumber <= ctx.t0Block + 1) {
      classification = 'Sniper';
      confidence = bump(confidence, isContract ? 'HIGH' : 'MEDIUM');
      evidence.push(`Buy landed in block ${trade.blockNumber}, within one block of T0 ${ctx.t0Block}.`);
      if (!isContract) evidence.push('Contradictory evidence: a first-block buy from an EOA is timing, not proof of an autonomous sniper.');
    }
    if (sandwich.has(trade.id)) {
      classification = 'Sandwich';
      confidence = bump(confidence, isContract ? 'HIGH' : 'MEDIUM');
      evidence.push('Same-block buy then sell surrounds another wallet buy. This is sandwich-pattern evidence, not an identity claim.');
    }
    const sameBlockFlip = mine.some((item) => item.side !== trade.side && item.blockNumber === trade.blockNumber && item.id !== trade.id);
    if (classification === 'Unknown' && sameBlockFlip && !sandwich.has(trade.id)) {
      classification = 'MEV';
      confidence = bump(confidence, isContract ? 'MEDIUM' : 'LOW');
      evidence.push('Same-block buy and sell without a surrounded victim. A searcher or a person using a router can both produce this. It is not an identity.');
    }
    const oppositeSoon = mine.some((item) => item.side !== trade.side && Math.abs(item.timestamp - trade.timestamp) <= 120 && item.id !== trade.id);
    if (classification === 'Unknown' && oppositeSoon) {
      classification = 'Arbitrage';
      confidence = bump(confidence, 'MEDIUM');
      evidence.push('Opposite-side round trip within 120 seconds.');
    }
    const bothSides = mine.some((item) => item.side === 'BUY') && mine.some((item) => item.side === 'SELL');
    const span = mine.length ? Math.max(...mine.map((item) => item.timestamp)) - Math.min(...mine.map((item) => item.timestamp)) : 0;
    if (classification === 'Unknown' && bothSides && mine.length >= 4 && span > 180) {
      classification = 'Market-maker';
      confidence = bump(confidence, 'LOW');
      evidence.push('Both sides across more than three minutes and at least four trades. Two-sided flow is a weak market-making hint, not proof of a quoting algorithm.');
    }
    const follows = [...followCount.entries()].find(([key, count]) => key.startsWith(trade.wallet.toLowerCase() + '->') && count >= 3);
    if (classification === 'Unknown' && follows) {
      classification = 'Copy-trading';
      confidence = bump(confidence, 'MEDIUM');
      evidence.push('Bought within two blocks of the same other wallet at least three times.');
    }
    if (classification === 'Unknown' && trade.side === 'BUY' && trade.minute <= 5) {
      classification = 'New-pair scanner';
      confidence = bump(confidence, 'LOW');
      evidence.push('Buy in the first five minutes after the window opened. Timing alone is a weak signal.');
    }
    const buyCount = mine.filter((item) => item.side === 'BUY').length;
    if (classification === 'Unknown' && buyCount >= 3) {
      classification = 'Momentum';
      confidence = bump(confidence, 'LOW');
      evidence.push('Three or more buys from the same signer in this window.');
    }
    if (trade.assistedExecution && !isContract && confidence === 'HIGH') confidence = 'MEDIUM';
    if (!evidence.length) evidence.push('No automation pattern met the evidence bar. Classified unknown.');
    evidence.push(`Model ${HEURISTIC_VERSION}. Labels are ordinal evidence, not probabilities.`);
    return { ...trade, classification, confidence, evidence, score: ordinalScore(confidence) };
  });
}

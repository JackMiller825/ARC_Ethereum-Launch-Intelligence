import { CHAIN_ID, ROUTERS, WETH } from './constants';
import type { RawSwap } from './decode';
import { sameAddr, weiToNumber } from '../format';
import type { Confidence, Trade, Valuation } from '../types';

export type TxMeta = { from: string; to: string | null };

type Leg = {
  swap: RawSwap;
  side: 'BUY' | 'SELL';
  tokenAmount: bigint;
  quoteToken: string;
  quoteAbs: bigint;
};

export function perspective(swap: RawSwap, token: string): Leg | null {
  const is0 = sameAddr(swap.token0, token);
  const is1 = sameAddr(swap.token1, token);
  if (!is0 && !is1) return null;
  const poolToken = is0 ? swap.amount0 : swap.amount1;
  const poolQuote = is0 ? swap.amount1 : swap.amount0;
  const userToken = -poolToken;
  if (userToken === 0n) return null;
  return {
    swap,
    side: userToken > 0n ? 'BUY' : 'SELL',
    tokenAmount: userToken > 0n ? userToken : -userToken,
    quoteToken: is0 ? swap.token1 : swap.token0,
    quoteAbs: poolQuote < 0n ? -poolQuote : poolQuote,
  };
}

function userDelta(swap: RawSwap, asset: string) {
  if (sameAddr(swap.token0, asset)) return -swap.amount0;
  if (sameAddr(swap.token1, asset)) return -swap.amount1;
  return 0n;
}

export type DraftTrade = {
  id: string;
  side: 'BUY' | 'SELL';
  wallet: string;
  recipient: string;
  ethWei: bigint | null;
  tokenAmount: bigint;
  valuation: Valuation;
  protocol: RawSwap['protocol'];
  pool: string;
  txHash: `0x${string}`;
  logIndex: number;
  blockNumber: number;
  blockHash: string;
  txIndex: number;
  method: string;
  hops: number;
  assistedExecution: boolean;
};

export function reconcileTransaction(swaps: RawSwap[], tx: TxMeta | undefined, token: string): DraftTrade[] {
  const signer = tx?.from || '';
  const method = (tx?.to && ROUTERS[tx.to.toLowerCase()]) || (tx?.to ? 'Contract call' : 'Unknown caller');
  const assistedExecution = Boolean(tx?.to && ROUTERS[tx.to.toLowerCase()] && signer);
  const legs = swaps.map((swap) => perspective(swap, token)).filter((leg): leg is Leg => Boolean(leg));
  if (!legs.length) return [];
  const legIds = new Set(legs.map((leg) => `${leg.swap.txHash}:${leg.swap.logIndex}`));
  let paidElsewhere = 0n;
  let receivedElsewhere = 0n;
  for (const swap of swaps) {
    if (legIds.has(`${swap.txHash}:${swap.logIndex}`)) continue;
    const delta = userDelta(swap, WETH);
    if (delta < 0n) paidElsewhere += -delta;
    if (delta > 0n) receivedElsewhere += delta;
  }
  const used = { buy: false, sell: false };
  const grouped = new Map<'BUY' | 'SELL', Leg[]>();
  for (const leg of legs) {
    grouped.set(leg.side, [...(grouped.get(leg.side) || []), leg]);
  }
  const drafts: DraftTrade[] = [];
  for (const side of ['BUY', 'SELL'] as const) {
    const group = grouped.get(side);
    if (!group?.length) continue;
    const exact = group.reduce((sum, leg) => sum + (sameAddr(leg.quoteToken, WETH) ? leg.quoteAbs : 0n), 0n);
    let ethWei: bigint | null = null;
    let valuation: Valuation = 'unsupported';
    if (exact > 0n) {
      ethWei = exact;
      valuation = 'weth-pool';
    } else if (side === 'BUY' && paidElsewhere > 0n && !used.buy) {
      ethWei = paidElsewhere;
      valuation = 'multihop-weth';
      used.buy = true;
    } else if (side === 'SELL' && receivedElsewhere > 0n && !used.sell) {
      ethWei = receivedElsewhere;
      valuation = 'multihop-weth';
      used.sell = true;
    }
    const first = group.slice().sort((a, b) => a.swap.logIndex - b.swap.logIndex)[0];
    drafts.push({
      id: `${CHAIN_ID}:${first.swap.txHash}:${(signer || first.swap.recipient).toLowerCase()}:${side}`,
      side,
      wallet: signer,
      recipient: first.swap.recipient,
      ethWei,
      tokenAmount: group.reduce((sum, leg) => sum + leg.tokenAmount, 0n),
      valuation,
      protocol: first.swap.protocol,
      pool: first.swap.pool,
      txHash: first.swap.txHash,
      logIndex: first.swap.logIndex,
      blockNumber: first.swap.blockNumber,
      blockHash: first.swap.blockHash,
      txIndex: first.swap.txIndex,
      method: group.length > 1 || swaps.length > legs.length ? `${method} · ${swaps.length} hops` : method,
      hops: swaps.length,
      assistedExecution,
    });
  }
  return drafts;
}

export function poolWethOutflow(swaps: RawSwap[], token: string) {
  let wei = 0n;
  for (const swap of swaps) {
    const leg = perspective(swap, token);
    if (!leg || !sameAddr(leg.quoteToken, WETH)) continue;
    wei += leg.quoteAbs;
  }
  return wei;
}

export function blankTrade(draft: DraftTrade, minute: number, timestamp: number, tokenAmountLabel: string): Trade {
  return {
    id: draft.id,
    minute,
    timestamp,
    wallet: draft.wallet || draft.recipient,
    recipient: draft.recipient,
    side: draft.side,
    eth: draft.ethWei === null ? null : weiToNumber(draft.ethWei),
    ethWei: draft.ethWei === null ? null : draft.ethWei.toString(),
    tokenAmount: tokenAmountLabel,
    classification: 'Unknown',
    confidence: 'UNKNOWN' as Confidence,
    evidence: draft.wallet ? [] : ['Signer could not be read from the transaction. Recipient is shown and is not treated as verified signer.'],
    score: 8,
    method: draft.method,
    isProject: false,
    assistedExecution: draft.assistedExecution,
    valuation: draft.valuation,
    protocol: draft.protocol,
    pool: draft.pool,
    txHash: draft.txHash,
    logIndex: draft.logIndex,
    blockNumber: draft.blockNumber,
    txIndex: draft.txIndex,
    origin: 'chain',
  };
}

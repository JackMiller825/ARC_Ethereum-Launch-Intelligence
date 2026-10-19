import { v2ImpactBps, v2TokensOut } from '../analytics/liquidity';

export type SimLeg = { side: 'BUY' | 'SELL'; amountIn: bigint };

export type SimStep = {
  side: 'BUY' | 'SELL';
  amountIn: string;
  amountOut: string;
  impactBps: number | null;
  reserveEth: string;
  reserveToken: string;
};

export type SimResult = { ok: true; steps: SimStep[]; label: string } | { ok: false; reason: string };

/** Sequential constant-product swaps. The fee stays in the input reserve. Hypothetical only. */
export function simulateConstantProduct(reserveEth: bigint, reserveToken: bigint, feeBps: bigint, legs: SimLeg[]): SimResult {
  if (reserveEth <= 0n || reserveToken <= 0n) return { ok: false, reason: 'Both reserves must be positive.' };
  if (feeBps < 0n || feeBps >= 10_000n) return { ok: false, reason: 'Fee must be between 0 and 9999 basis points.' };
  let eth = reserveEth;
  let token = reserveToken;
  const steps: SimStep[] = [];
  for (const leg of legs) {
    if (leg.amountIn <= 0n) return { ok: false, reason: 'Each trade size must be positive.' };
    const out = leg.side === 'BUY' ? v2TokensOut(eth, token, leg.amountIn, feeBps) : v2TokensOut(token, eth, leg.amountIn, feeBps);
    const impact = leg.side === 'BUY' ? v2ImpactBps(eth, token, leg.amountIn, feeBps) : v2ImpactBps(token, eth, leg.amountIn, feeBps);
    if (out === null || out <= 0n) return { ok: false, reason: 'A leg could not be executed against the current reserves.' };
    if (leg.side === 'BUY') { eth += leg.amountIn; token -= out; }
    else { token += leg.amountIn; eth -= out; }
    if (eth <= 0n || token <= 0n) return { ok: false, reason: 'Reserves were exhausted. The remaining legs were not invented.' };
    steps.push({ side: leg.side, amountIn: leg.amountIn.toString(), amountOut: out.toString(), impactBps: impact, reserveEth: eth.toString(), reserveToken: token.toString() });
  }
  return { ok: true, steps, label: 'Hypothetical constant-product simulation. Not recorded market history.' };
}

export function concentratedLiquidityLimit() {
  return 'Uniswap V3 and V4 concentrated liquidity are not simulated with the V2 constant-product curve.';
}

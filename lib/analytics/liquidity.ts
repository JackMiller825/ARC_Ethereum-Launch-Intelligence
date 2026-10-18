const FEE_DENOM = 10_000n;

/** Uniswap V2 constant-product output. Returns null when a reserve or input is not positive. */
export function v2TokensOut(reserveIn: bigint, reserveOut: bigint, amountIn: bigint, feeBps = 30n) {
  if (reserveIn <= 0n || reserveOut <= 0n || amountIn <= 0n || feeBps < 0n || feeBps >= FEE_DENOM) return null;
  const amountInWithFee = amountIn * (FEE_DENOM - feeBps);
  return (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOM + amountInWithFee);
}

/** Execution-price discount versus the spot reserve ratio, in basis points. Hypothetical, not a forecast. */
export function v2ImpactBps(reserveIn: bigint, reserveOut: bigint, amountIn: bigint, feeBps = 30n) {
  const out = v2TokensOut(reserveIn, reserveOut, amountIn, feeBps);
  if (out === null || out === 0n) return null;
  const spot = reserveOut * amountIn;
  const executed = out * reserveIn;
  if (spot <= 0n || executed > spot) return null;
  return Number(((spot - executed) * FEE_DENOM) / spot);
}

export const WHAT_IF_ETH = [0.5, 1, 2, 3, 5, 10];

export function liquidityScenarios(reserveEth: number, reserveToken: number) {
  if (!(reserveEth > 0) || !(reserveToken > 0)) return [];
  const reserveIn = BigInt(Math.round(reserveEth * 1e9)) * 1_000_000_000n;
  const reserveOut = BigInt(Math.round(reserveToken * 1e6));
  return WHAT_IF_ETH.map((eth) => {
    const amountIn = BigInt(Math.round(eth * 1e9)) * 1_000_000_000n;
    return { eth, impactBps: v2ImpactBps(reserveIn, reserveOut, amountIn), tokensOut: v2TokensOut(reserveIn, reserveOut, amountIn)?.toString() ?? null };
  });
}

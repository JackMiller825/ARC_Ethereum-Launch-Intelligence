import { decodeLog, type ChainLog } from './logs';
import { burnV2, burnV3, mintV2, mintV3, modifyV4, swapV2, swapV3, swapV4, TOPIC } from './constants';
import type { PoolInfo, Protocol } from '../types';
import { sameAddr } from '../format';

export type RawSwap = {
  protocol: Protocol;
  pool: string;
  poolId?: string;
  token0: string;
  token1: string;
  blockNumber: number;
  blockHash: string;
  txHash: `0x${string}`;
  txIndex: number;
  logIndex: number;
  sender: string;
  recipient: string;
  amount0: bigint;
  amount1: bigint;
  source: ChainLog['source'];
};

export type LiquidityEvent = {
  kind: 'mint' | 'burn';
  protocol: Protocol;
  pool: string;
  blockNumber: number;
  txHash: `0x${string}`;
  txIndex: number;
  logIndex: number;
  amount0: bigint;
  amount1: bigint;
  actor: string;
};

function asBig(value: unknown) {
  if (typeof value === 'bigint') return value;
  return BigInt(String(value ?? 0));
}

export function decodeSwap(log: ChainLog, pool: PoolInfo): RawSwap | null {
  const topic0 = log.topics[0]?.toLowerCase();
  if (pool.protocol === 'v2' && topic0 === TOPIC.swapV2) {
    const decoded = decodeLog(swapV2, log);
    const args = decoded.args as { sender: string; to: string; amount0In: bigint; amount1In: bigint; amount0Out: bigint; amount1Out: bigint };
    return {
      protocol: 'v2', pool: pool.address, token0: pool.token0, token1: pool.token1,
      blockNumber: log.blockNumber, blockHash: log.blockHash, txHash: log.transactionHash, txIndex: log.transactionIndex, logIndex: log.logIndex,
      sender: args.sender, recipient: args.to, source: log.source,
      amount0: asBig(args.amount0In) - asBig(args.amount0Out),
      amount1: asBig(args.amount1In) - asBig(args.amount1Out),
    };
  }
  if (pool.protocol === 'v3' && topic0 === TOPIC.swapV3) {
    const decoded = decodeLog(swapV3, log);
    const args = decoded.args as { sender: string; recipient: string; amount0: bigint; amount1: bigint };
    return baseSwap(pool, log, args.sender, args.recipient, asBig(args.amount0), asBig(args.amount1));
  }
  if (pool.protocol === 'v4' && topic0 === TOPIC.swapV4) {
    const decoded = decodeLog(swapV4, log);
    const args = decoded.args as { id: string; sender: string; amount0: bigint; amount1: bigint };
    if (pool.poolId && !sameAddr(args.id, pool.poolId) && args.id.toLowerCase() !== pool.poolId.toLowerCase()) return null;
    return baseSwap(pool, log, args.sender, args.sender, asBig(args.amount0), asBig(args.amount1), args.id);
  }
  return null;
}

function baseSwap(pool: PoolInfo, log: ChainLog, sender: string, recipient: string, amount0: bigint, amount1: bigint, poolId?: string): RawSwap {
  return {
    protocol: pool.protocol, pool: pool.address, poolId, token0: pool.token0, token1: pool.token1,
    blockNumber: log.blockNumber, blockHash: log.blockHash, txHash: log.transactionHash, txIndex: log.transactionIndex, logIndex: log.logIndex,
    sender, recipient, amount0, amount1, source: log.source,
  };
}

export function decodeLiquidity(log: ChainLog, pool: PoolInfo): LiquidityEvent | null {
  const topic0 = log.topics[0]?.toLowerCase();
  if (pool.protocol === 'v2' && topic0 === TOPIC.mintV2) {
    const args = decodeLog(mintV2, log).args as { sender: string; amount0: bigint; amount1: bigint };
    return liq('mint', pool, log, args.sender, asBig(args.amount0), asBig(args.amount1));
  }
  if (pool.protocol === 'v2' && topic0 === TOPIC.burnV2) {
    const args = decodeLog(burnV2, log).args as { sender: string; amount0: bigint; amount1: bigint };
    return liq('burn', pool, log, args.sender, asBig(args.amount0), asBig(args.amount1));
  }
  if (pool.protocol === 'v3' && topic0 === TOPIC.mintV3) {
    const args = decodeLog(mintV3, log).args as { owner: string; amount0: bigint; amount1: bigint };
    return liq('mint', pool, log, args.owner, asBig(args.amount0), asBig(args.amount1));
  }
  if (pool.protocol === 'v3' && topic0 === TOPIC.burnV3) {
    const args = decodeLog(burnV3, log).args as { owner: string; amount0: bigint; amount1: bigint };
    return liq('burn', pool, log, args.owner, asBig(args.amount0), asBig(args.amount1));
  }
  if (pool.protocol === 'v4' && topic0 === TOPIC.modifyV4) {
    const args = decodeLog(modifyV4, log).args as { sender: string; liquidityDelta: bigint };
    const kind = asBig(args.liquidityDelta) >= 0n ? 'mint' : 'burn';
    return liq(kind, pool, log, args.sender, 0n, 0n);
  }
  return null;
}

function liq(kind: 'mint' | 'burn', pool: PoolInfo, log: ChainLog, actor: string, amount0: bigint, amount1: bigint): LiquidityEvent {
  return { kind, protocol: pool.protocol, pool: pool.address, blockNumber: log.blockNumber, txHash: log.transactionHash, txIndex: log.transactionIndex, logIndex: log.logIndex, amount0, amount1, actor };
}

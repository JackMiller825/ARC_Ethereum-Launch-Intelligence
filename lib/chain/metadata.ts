import { getAddress, parseAbi, type PublicClient } from 'viem';
import type { Token } from '../types';

const erc20 = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
]);

export async function readErc20(client: PublicClient, address: string) {
  const checksum = getAddress(address);
  const code = await client.getBytecode({ address: checksum });
  if (!code || code === '0x') throw new Error('This address has no contract code on Ethereum mainnet.');
  let name = 'Unknown token';
  let symbol = 'UNKNOWN';
  let decimals = 18;
  try {
    const [n, s, d] = await Promise.all([
      client.readContract({ address: checksum, abi: erc20, functionName: 'name' }),
      client.readContract({ address: checksum, abi: erc20, functionName: 'symbol' }),
      client.readContract({ address: checksum, abi: erc20, functionName: 'decimals' }),
    ]);
    name = n || name;
    symbol = s || symbol;
    decimals = Number(d);
  } catch {
    throw new Error('Contract code exists, but name/symbol/decimals could not be read. It may not be a standard ERC-20. No market figures were invented.');
  }
  return { address: checksum, name, symbol, decimals };
}

export async function readBlockscoutProfile(base: string, address: string, signal?: AbortSignal) {
  const root = base.replace(/\/$/, '');
  const [tokenRes, addressRes] = await Promise.all([
    fetch(`${root}/api/v2/tokens/${address}`, { signal, headers: { accept: 'application/json' } }).catch(() => null),
    fetch(`${root}/api/v2/addresses/${address}`, { signal, headers: { accept: 'application/json' } }).catch(() => null),
  ]);
  const token = tokenRes?.ok ? await tokenRes.json() as Record<string, unknown> : null;
  const profile = addressRes?.ok ? await addressRes.json() as Record<string, unknown> : null;
  let deployBlock: number | null = null;
  let deployTimestamp: number | null = null;
  const creation = typeof profile?.creation_transaction_hash === 'string' ? profile.creation_transaction_hash : '';
  if (creation) {
    const txRes = await fetch(`${root}/api/v2/transactions/${creation}`, { signal, headers: { accept: 'application/json' } }).catch(() => null);
    if (txRes?.ok) {
      const tx = await txRes.json() as { block_number?: number; timestamp?: string };
      deployBlock = typeof tx.block_number === 'number' ? tx.block_number : null;
      deployTimestamp = tx.timestamp ? Math.floor(Date.parse(tx.timestamp) / 1000) : null;
    }
  }
  const holders = Number(token?.holders_count ?? token?.holders ?? NaN);
  return {
    holders: Number.isFinite(holders) ? holders : null,
    verified: Boolean(profile?.is_verified),
    deployer: typeof profile?.creator_address_hash === 'string' ? getAddress(profile.creator_address_hash) : null,
    deployBlock,
    deployTimestamp,
    creationTx: creation || null,
  };
}

export function tokenRecord(onchain: { address: string; name: string; symbol: string; decimals: number }, profile: Awaited<ReturnType<typeof readBlockscoutProfile>> | null): Token {
  return {
    address: onchain.address,
    name: onchain.name,
    symbol: onchain.symbol,
    decimals: onchain.decimals,
    launch: profile?.deployTimestamp ? new Date(profile.deployTimestamp * 1000).toISOString() : '',
    status: 'On-chain metadata',
    initialEth: null,
    holders: profile?.holders ?? null,
    source: profile ? 'blockscout' : 'chain',
    verified: profile?.verified,
    deployer: profile?.deployer || null,
  };
}

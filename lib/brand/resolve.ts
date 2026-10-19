import { isAddress } from 'viem';
import { createChainClient } from '../chain/client';
import { readErc20 } from '../chain/metadata';

export function addressError(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter a contract address, or use future-token mode. A ticker was not used to pick a substitute.';
  if (!isAddress(trimmed)) return 'That is not a valid Ethereum address. No other token was substituted.';
  return null;
}

export async function resolveOnchainIdentity(address: string, rpcUrls: string[]) {
  const error = addressError(address);
  if (error) return { ok: false as const, error };
  const urls = rpcUrls.filter(Boolean);
  if (!urls.length) return { ok: false as const, error: 'No RPC is configured, so name and symbol were not read. No ticker search was used instead.' };
  let last = 'Metadata lookup failed.';
  for (const url of urls) {
    try {
      const token = await readErc20(createChainClient(url), address);
      return { ok: true as const, name: token.name, symbol: token.symbol, address: token.address, source: `ERC-20 name() and symbol() via ${url}` };
    } catch (reason) {
      last = reason instanceof Error ? reason.message : last;
    }
  }
  return { ok: false as const, error: `${last} No other token was substituted.` };
}

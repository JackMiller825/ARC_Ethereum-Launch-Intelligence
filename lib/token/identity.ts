import { getAddress, isAddress } from 'viem';

export function existingTokenId(chainId: number, address: string) {
  if (!isAddress(address)) throw new Error('A contract address is required for an existing token id.');
  return `${chainId}:${getAddress(address).toLowerCase()}`;
}

export function futureCandidateId(localId: string) {
  const id = localId.trim();
  if (!id) throw new Error('A future candidate needs its own id. Name and ticker are not unique.');
  return `candidate:${id}`;
}

export function matchingSnapshot<T extends { token: { address: string } }>(active: T | null | undefined, ca: string) {
  const next = ca.trim();
  if (!active || !next) return null;
  return active.token.address.toLowerCase() === next.toLowerCase() ? active : null;
}

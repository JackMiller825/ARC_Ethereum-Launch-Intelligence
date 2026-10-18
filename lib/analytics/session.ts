import { getAddress, isAddress } from 'viem';
import { computeKpis } from '../chain/kpis';
import { tradesInView } from '../intervals';
import type { AnalysisSuccess, LibraryCatalog } from '../types';

export const emptyCatalog = (): LibraryCatalog => ({ favorites: [], recents: [], groups: [] });

export function canonicalAddress(value: string) {
  const trimmed = value.trim();
  if (!isAddress(trimmed)) throw new Error('Enter a valid 0x-prefixed Ethereum address.');
  return getAddress(trimmed);
}

export function tokenIdentity(address: string) {
  return `1:${canonicalAddress(address).toLowerCase()}`;
}

export function rememberToken(catalog: LibraryCatalog, address: string): LibraryCatalog {
  const key = canonicalAddress(address).toLowerCase();
  return { ...catalog, recents: [key, ...catalog.recents.filter((item) => item !== key)].slice(0, 12) };
}

export function toggleFavorite(catalog: LibraryCatalog, address: string): LibraryCatalog {
  const key = canonicalAddress(address).toLowerCase();
  const favorites = catalog.favorites.includes(key) ? catalog.favorites.filter((item) => item !== key) : [key, ...catalog.favorites];
  return { ...catalog, favorites };
}

export function saveGroup(catalog: LibraryCatalog, name: string, addresses: string[]): LibraryCatalog {
  const id = name.trim().toLowerCase().replace(/\s+/g, '-') || 'group';
  const normalized = [...new Set(addresses.map((item) => canonicalAddress(item).toLowerCase()))];
  const next = { id, name: name.trim() || 'Comparison', addresses: normalized };
  return { ...catalog, groups: [...catalog.groups.filter((group) => group.id !== id), next] };
}

export type AlignedLaunch = {
  address: string;
  symbol: string;
  requestedMinutes: number;
  storedMinutes: number;
  covered: boolean;
  grossBuyWei: string;
  grossSellWei: string;
  botBuyShare: number | null;
  uniqueBuyers: number;
  initialLiquidityWei: string | null;
  buyerRetention: number | null;
  concentrationTop5: number | null;
  note: string;
};

export function alignLaunch(snapshot: AnalysisSuccess, minutes: number): AlignedLaunch {
  const stored = snapshot.window.minutes;
  const covered = stored >= minutes;
  const trades = tradesInView(snapshot.trades, minutes, stored);
  const kpis = computeKpis(trades, {
    initialLiquidityWei: snapshot.kpis.initialLiquidityWei ? BigInt(snapshot.kpis.initialLiquidityWei) : null,
    lpEvents: snapshot.kpis.lpEvents,
    t0Block: snapshot.timeline.t0Block,
  });
  return {
    address: snapshot.token.address,
    symbol: snapshot.token.symbol,
    requestedMinutes: minutes,
    storedMinutes: stored,
    covered,
    grossBuyWei: kpis.grossBuyWei,
    grossSellWei: kpis.grossSellWei,
    botBuyShare: kpis.botBuyShare,
    uniqueBuyers: kpis.uniqueBuyers,
    initialLiquidityWei: kpis.initialLiquidityWei,
    buyerRetention: kpis.buyerRetention,
    concentrationTop5: kpis.concentrationTop5,
    note: covered
      ? `First ${minutes} minutes after this token's T0, using the stored ${stored} minute index.`
      : `Stored index is ${stored} minutes, shorter than the requested ${minutes}. Figures use the stored window and are not ranked as a full interval.`,
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { getAddress, isAddress } from 'viem';

export async function GET(req: NextRequest) {
  const ca = req.nextUrl.searchParams.get('ca')?.trim() || '';
  if (!isAddress(ca)) return NextResponse.json({ error: 'Enter a valid 0x-prefixed Ethereum address.' }, { status: 400 });
  const normalized = getAddress(ca);
  const base = (process.env.BLOCKSCOUT_BASE_URL || 'https://eth.blockscout.com').replace(/\/$/, '');
  try {
    const response = await fetch(`${base}/api/v2/tokens/${normalized}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(8500), cache: 'no-store' });
    if (!response.ok) throw new Error(`Blockscout HTTP ${response.status}`);
    const body = await response.json() as { name?: string; symbol?: string; holders_count?: number; is_verified?: boolean; is_verified_via_admin_panel?: boolean };
    if (!body.name || !body.symbol) throw new Error('Blockscout did not return a name and symbol. No other token was substituted.');
    return NextResponse.json({
      address: normalized,
      name: String(body.name),
      symbol: String(body.symbol),
      launch: '',
      status: 'Live contract metadata',
      initialEth: null,
      holders: Number(body.holders_count || 0),
      source: 'blockscout' as const,
      verified: Boolean(body.is_verified || body.is_verified_via_admin_panel),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Metadata lookup failed.';
    return NextResponse.json({ error: `${message} No other token was substituted.` }, { status: 502 });
  }
}

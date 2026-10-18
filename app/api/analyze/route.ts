import { NextRequest, NextResponse } from 'next/server';
import { jsonError, runAnalysis, tooMany, windowFrom } from '@/lib/api/service';
import { addressSchema } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (tooMany(req)) return NextResponse.json({ error: 'Rate limit: 20 requests per minute.' }, { status: 429 });
  const parsed = addressSchema.safeParse(req.nextUrl.searchParams.get('ca') || '');
  if (!parsed.success) return NextResponse.json({ error: 'Invalid Ethereum contract address' }, { status: 400 });
  try {
    const result = await runAnalysis(parsed.data, windowFrom(req));
    if (!result.ok) return NextResponse.json({ status: 'unavailable', token: parsed.data, message: result.reason, warnings: result.warnings }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error, 500);
  }
}

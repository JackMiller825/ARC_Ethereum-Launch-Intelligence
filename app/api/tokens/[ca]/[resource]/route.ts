import { NextRequest } from 'next/server';
import { handleTokenResource, jsonError } from '@/lib/api/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resources = new Set(['metadata', 'pools', 'launch', 'metrics', 'trades', 'wallets', 'comparisons']);

export async function GET(req: NextRequest, ctx: { params: Promise<{ ca: string; resource: string }> }) {
  const { ca, resource } = await ctx.params;
  if (!resources.has(resource)) return jsonError(new Error('Unknown resource.'), 404);
  try {
    return await handleTokenResource(req, ca, resource);
  } catch (error) {
    return jsonError(error, 500);
  }
}

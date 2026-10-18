import { isAddress } from 'viem';
import { z } from 'zod';
import { absoluteMinutes, MAX_MINUTES } from './intervals';
import type { WindowSpec } from './types';

export const addressSchema = z.string().trim().refine((value) => isAddress(value), 'Enter a valid 0x-prefixed Ethereum address.');

export const minutesSchema = z.number().int().min(1).max(MAX_MINUTES);

export function parseWindow(input: { mode?: string | null; minutes?: string | number | null; start?: string | null; end?: string | null }): WindowSpec {
  const mode = input.mode || 'launch';
  if (mode === 'absolute') {
    const startIso = z.string().min(10).parse(input.start);
    const endIso = z.string().min(10).parse(input.end);
    const minutes = absoluteMinutes(startIso, endIso);
    return { mode: 'absolute', startIso: new Date(startIso).toISOString(), endIso: new Date(endIso).toISOString(), minutes };
  }
  if (mode !== 'launch' && mode !== 'trailing') throw new Error('Mode must be launch, trailing, or absolute.');
  const raw = input.minutes === null || input.minutes === undefined || input.minutes === '' ? 60 : Number(input.minutes);
  const minutes = minutesSchema.parse(raw);
  return mode === 'launch' ? { mode, minutes } : { mode, minutes };
}

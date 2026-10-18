const WEI = 10n ** 18n;

export function sameAddr(a?: string | null, b?: string | null) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

export function shortAddr(address: string) {
  if (!address) return '—';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatEth(wei: bigint | string | null | undefined, digits = 4) {
  if (wei === null || wei === undefined || wei === '') return '—';
  const value = typeof wei === 'string' ? BigInt(wei) : wei;
  const neg = value < 0n;
  const abs = neg ? -value : value;
  const whole = abs / WEI;
  const frac = (abs % WEI).toString().padStart(18, '0').slice(0, digits).replace(/0+$/, '');
  return `${neg ? '-' : ''}${whole.toString()}${frac ? `.${frac}` : ''}`;
}

export function weiToNumber(wei: bigint | string | null | undefined) {
  if (wei === null || wei === undefined || wei === '') return null;
  const value = typeof wei === 'string' ? BigInt(wei) : wei;
  const neg = value < 0n;
  const abs = neg ? -value : value;
  const whole = Number(abs / WEI);
  const frac = Number(abs % WEI) / 1e18;
  return (neg ? -1 : 1) * (whole + frac);
}

export function parseHexOrDec(value: string | number | bigint) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  return value.startsWith('0x') ? BigInt(value) : BigInt(value);
}

export function formatToken(raw: bigint, decimals: number, digits = 2) {
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const frac = (raw % base).toString().padStart(decimals, '0').slice(0, digits).replace(/0+$/, '');
  return `${whole.toString()}${frac ? `.${frac}` : ''}`;
}

export function utcStamp(unixSeconds: number | null) {
  if (!unixSeconds) return '—';
  return new Date(unixSeconds * 1000).toISOString().replace('.000Z', 'Z');
}

export function ordinalScore(confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN') {
  if (confidence === 'HIGH') return 100;
  if (confidence === 'MEDIUM') return 66;
  if (confidence === 'LOW') return 33;
  return 8;
}

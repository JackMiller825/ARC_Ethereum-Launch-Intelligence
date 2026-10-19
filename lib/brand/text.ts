export function normalizeName(value: string) {
  return value.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
}

export function normalizeTicker(value: string) {
  return value.normalize('NFKC').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

export function fold(value: string) {
  return normalizeName(value).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function slug(value: string) {
  return fold(value).replace(/\s+/g, '-');
}

export function levenshtein(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const next = a[i - 1] === b[j - 1] ? previous : Math.min(previous, row[j - 1], row[j]) + 1;
      previous = row[j];
      row[j] = next;
    }
  }
  return row[b.length];
}

export function similarity(a: string, b: string) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

export function soundex(value: string) {
  const letters = value.toUpperCase().replace(/[^A-Z]/g, '');
  if (!letters) return '';
  const map: Record<string, string> = { B: '1', F: '1', P: '1', V: '1', C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2', D: '3', T: '3', L: '4', M: '5', N: '5', R: '6' };
  let out = letters[0];
  let last = map[letters[0]] || '';
  for (const char of letters.slice(1)) {
    const code = map[char] || '';
    if (code && code !== last) out += code;
    last = code || last;
    if (out.length === 4) break;
  }
  return out.padEnd(4, '0');
}

export function wordsOf(value: string) {
  return normalizeName(value).split(/\s+/).filter(Boolean);
}

export function initialsOf(value: string) {
  return wordsOf(value).map((word) => word[0] || '').join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(10, Math.round(value)));
}

export function hasEmoji(value: string) {
  return /\p{Extended_Pictographic}/u.test(value);
}

export function mixedScript(value: string) {
  return /[\u0400-\u04FF]/.test(value) && /[A-Za-z]/.test(value);
}

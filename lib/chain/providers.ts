type Sample = { ok: number; fail: number; latencyMs: number };

const samples = new Map<string, Sample>();

export function noteProvider(url: string, ok: boolean, latencyMs: number) {
  const current = samples.get(url) || { ok: 0, fail: 0, latencyMs: 0 };
  current.ok += ok ? 1 : 0;
  current.fail += ok ? 0 : 1;
  current.latencyMs += Math.max(0, latencyMs);
  samples.set(url, current);
}

export function providerScore(url: string) {
  const sample = samples.get(url);
  if (!sample) return 0;
  const calls = sample.ok + sample.fail;
  const success = calls ? sample.ok / calls : 0;
  const average = calls ? sample.latencyMs / calls : 10_000;
  return success * 1000 - average / 100 - sample.fail * 50;
}

/** Healthy, faster endpoints move ahead. Unknown endpoints keep their original order. */
export function rankUrls(urls: string[]) {
  return urls.map((url, index) => ({ url, index, score: providerScore(url) })).sort((a, b) => b.score - a.score || a.index - b.index).map((item) => item.url);
}

export function providerReport() {
  return [...samples.entries()].map(([url, sample]) => ({ url, ...sample }));
}

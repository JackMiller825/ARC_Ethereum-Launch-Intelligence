export type RecallResponse = { name: string; ticker: string; meaning: string };

function norm(value: string) {
  return value.trim().toLowerCase();
}

export function recallStats(expected: { name: string; ticker: string }, responses: RecallResponse[]) {
  const n = responses.length;
  if (!n) return { n: 0, nameRate: null as number | null, tickerRate: null as number | null, meaningRate: null as number | null, note: 'No responses are stored. A recall rate was not invented.' };
  const nameHits = responses.filter((item) => norm(item.name) === norm(expected.name)).length;
  const tickerHits = responses.filter((item) => norm(item.ticker) === norm(expected.ticker)).length;
  const meaningHits = responses.filter((item) => item.meaning.trim().length > 0).length;
  return {
    n,
    nameRate: nameHits / n,
    tickerRate: tickerHits / n,
    meaningRate: meaningHits / n,
    note: 'Rates use only responses saved in this browser. Meaning rate counts a non-empty meaning, not whether the meaning is correct. This is not a crowd study.',
  };
}

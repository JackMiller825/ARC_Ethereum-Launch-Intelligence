export type RecognitionRecord = {
  id: string;
  sessionId: string;
  participantId: string;
  candidateId: string;
  stimulusVersion: string;
  exposureMs: 5000;
  displayedMs: number | null;
  name: string;
  ticker: string;
  meaning: string;
  clarity: number | null;
  memorability: number | null;
  completedAt: number;
  interrupted: boolean;
  source: 'local-session' | 'imported';
};

export type RecognitionSummary = {
  n: number;
  exactName: number | null;
  exactTicker: number | null;
  normalizedName: number | null;
  meaningPresent: number | null;
  meanClarity: number | null;
  note: string;
};

function fold(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function recognitionSummary(expected: { name: string; ticker: string }, records: RecognitionRecord[]): RecognitionSummary {
  const done = records.filter((record) => !record.interrupted);
  const n = done.length;
  if (!n) return { n: 0, exactName: null, exactTicker: null, normalizedName: null, meaningPresent: null, meanClarity: null, note: 'No completed responses are stored. A recognition rate was not invented.' };
  const exactName = done.filter((record) => fold(record.name) === fold(expected.name) && record.name.trim().toLowerCase() === expected.name.trim().toLowerCase()).length / n;
  const normalizedName = done.filter((record) => fold(record.name) === fold(expected.name)).length / n;
  const exactTicker = done.filter((record) => record.ticker.trim().toLowerCase() === expected.ticker.trim().toLowerCase()).length / n;
  const meaningPresent = done.filter((record) => record.meaning.trim().length > 0).length / n;
  const clarity = done.map((record) => record.clarity).filter((value): value is number => value !== null);
  const imported = done.some((record) => record.source === 'imported');
  return {
    n,
    exactName,
    exactTicker,
    normalizedName,
    meaningPresent,
    meanClarity: clarity.length ? clarity.reduce((sum, value) => sum + value, 0) / clarity.length : null,
    note: `n=${n} completed local or imported responses. Name, ticker, and meaning stay separate. ${n < 30 ? 'This sample is too small for a significance claim.' : 'Even a larger sample here is not a population estimate.'} ${imported ? 'Imported rows are labeled and are not treated as a live session.' : 'Rows were saved from this browser.'}`,
  };
}

export function repeatExposure(records: RecognitionRecord[], candidateId: string, participantId: string) {
  return records.some((record) => !record.interrupted && record.candidateId === candidateId && record.participantId === participantId);
}

export function recognitionCsv(records: RecognitionRecord[]) {
  const header = 'source,session_id,participant_id,candidate_id,stimulus_version,exposure_ms,displayed_ms,name,ticker,meaning,clarity,memorability,completed_at,interrupted';
  const rows = records.map((record) => [record.source, record.sessionId, record.participantId, record.candidateId, record.stimulusVersion, record.exposureMs, record.displayedMs ?? '', csvCell(record.name), csvCell(record.ticker), csvCell(record.meaning), record.clarity ?? '', record.memorability ?? '', record.completedAt, record.interrupted].join(','));
  return [header, ...rows].join('\n');
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function parseRecognitionCsv(text: string): RecognitionRecord[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  return lines.slice(1).map((line, index) => {
    const cells = splitCsv(line);
    return {
      id: `imported:${index}:${cells[3] || 'candidate'}`,
      source: 'imported',
      sessionId: cells[1] || `import:${index}`,
      participantId: cells[2] || 'imported',
      candidateId: cells[3] || '',
      stimulusVersion: cells[4] || 'imported',
      exposureMs: 5000,
      displayedMs: cells[6] ? Number(cells[6]) : null,
      name: cells[7] || '',
      ticker: cells[8] || '',
      meaning: cells[9] || '',
      clarity: cells[10] ? Number(cells[10]) : null,
      memorability: cells[11] ? Number(cells[11]) : null,
      completedAt: Number(cells[12]) || 0,
      interrupted: cells[13] === 'true',
    };
  });
}

function splitCsv(line: string) {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { current += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else current += char;
  }
  cells.push(current);
  return cells;
}

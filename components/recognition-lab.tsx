"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { parseRecognitionCsv, recognitionCsv, recognitionSummary, repeatExposure, type RecognitionRecord } from '@/lib/brand/recognition';
import { clearRecognition, listRecognition, saveRecognition } from '@/lib/store/idb';

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function RecognitionLab({ name, ticker, candidateId }: { name: string; ticker: string; candidateId: string }) {
  const [consent, setConsent] = useState(false);
  const [participant, setParticipant] = useState('');
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'showing' | 'recall'>('idle');
  const [shownFor, setShownFor] = useState<number | null>(null);
  const [responseName, setResponseName] = useState('');
  const [responseTicker, setResponseTicker] = useState('');
  const [meaning, setMeaning] = useState('');
  const [clarity, setClarity] = useState('');
  const [memory, setMemory] = useState('');
  const [records, setRecords] = useState<RecognitionRecord[]>([]);
  const [note, setNote] = useState('No completed response is stored until you submit one.');
  const started = useRef(0);
  const timer = useRef<number | null>(null);
  useEffect(() => { void listRecognition().then(setRecords).catch(() => setRecords([])); return () => { if (timer.current) window.clearTimeout(timer.current); }; }, []);
  const summary = useMemo(() => recognitionSummary({ name, ticker }, records.filter((record) => record.candidateId === candidateId)), [records, name, ticker, candidateId]);

  function interrupt(reason: string) {
    if (timer.current) window.clearTimeout(timer.current);
    const displayed = started.current ? Math.round(performance.now() - started.current) : null;
    setVisible(false);
    setPhase('idle');
    setShownFor(displayed);
    setNote(reason);
  }

  function begin() {
    if (!consent) { setNote('Consent is required before a stimulus is shown.'); return; }
    if (!name.trim() || !ticker.trim()) { setNote('Enter a name and ticker before starting a test.'); return; }
    const who = participant.trim() || 'local-session';
    if (repeatExposure(records, candidateId, who) && !window.confirm('This participant already completed this candidate. A repeat is not an independent first impression. Continue anyway?')) return;
    setResponseName('');
    setResponseTicker('');
    setMeaning('');
    setVisible(true);
    setPhase('showing');
    started.current = performance.now();
    timer.current = window.setTimeout(() => {
      setShownFor(Math.round(performance.now() - started.current));
      setVisible(false);
      setPhase('recall');
    }, 5000);
  }

  async function save() {
    const record: RecognitionRecord = {
      id: `local:${Date.now()}`,
      sessionId: `session:${candidateId}`,
      participantId: participant.trim() || 'local-session',
      candidateId,
      stimulusVersion: `${name}|${ticker}`,
      exposureMs: 5000,
      displayedMs: shownFor,
      name: responseName,
      ticker: responseTicker,
      meaning,
      clarity: clarity === '' ? null : Number(clarity),
      memorability: memory === '' ? null : Number(memory),
      completedAt: Date.now(),
      interrupted: false,
      source: 'local-session',
    };
    await saveRecognition(record);
    setRecords((current) => [...current, record]);
    setPhase('idle');
    setNote('Saved one response from this browser. It is not a crowd study.');
  }

  return <section className="panel">
    <div className="panel-eyebrow">RECOGNITION</div>
    <h3>Five-second recognition test</h3>
    <p className="panel-desc">A person must consent, see the candidate, and type what they remember. ARC does not create participants. Records stay in this browser unless you export them. A shared server for many people is not deployed.</p>
    <label className="check-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I agree to store this anonymous recall in this browser.</span></label>
    <label>Anonymous session label<input aria-label="Participant label" value={participant} onChange={(event) => setParticipant(event.target.value)} placeholder="Optional label you choose. Not a device fingerprint." /></label>
    <div className="feature-actions"><button className="btn primary" type="button" onClick={begin}>Start 5 second exposure</button><button className="btn ghost" type="button" onClick={() => interrupt('Restart cleared the stimulus. No response was saved for the interrupted attempt.')}>Restart test</button></div>
    {visible && phase === 'showing' && <p className="recognition-stimulus" aria-live="polite"><strong>{name}</strong><span>{ticker}</span></p>}
    {phase === 'recall' && <div className="parameter-grid">
      <label>Name you remember<input aria-label="Recognition name" value={responseName} onChange={(event) => setResponseName(event.target.value)} /></label>
      <label>Ticker you remember<input aria-label="Recognition ticker" value={responseTicker} onChange={(event) => setResponseTicker(event.target.value)} /></label>
      <label>What it means<input aria-label="Recognition meaning" value={meaning} onChange={(event) => setMeaning(event.target.value)} /></label>
      <label>Clarity 1–5<input aria-label="Clarity rating" type="number" min="1" max="5" value={clarity} onChange={(event) => setClarity(event.target.value)} /></label>
      <label>Memorability 1–5<input aria-label="Memorability rating" type="number" min="1" max="5" value={memory} onChange={(event) => setMemory(event.target.value)} /></label>
      <button className="btn secondary" type="button" onClick={() => void save()}>Save response</button>
    </div>}
    <p className="panel-desc">{note} Completed n={summary.n}. Exact name {summary.exactName === null ? '—' : `${Math.round(summary.exactName * 100)}%`}. Exact ticker {summary.exactTicker === null ? '—' : `${Math.round(summary.exactTicker * 100)}%`}. Normalized name {summary.normalizedName === null ? '—' : `${Math.round(summary.normalizedName * 100)}%`}. Meaning present {summary.meaningPresent === null ? '—' : `${Math.round(summary.meaningPresent * 100)}%`}. {summary.note}</p>
    <div className="feature-actions">
      <button className="btn ghost" type="button" onClick={() => download('arc-recognition.csv', recognitionCsv(records))}>Export CSV</button>
      <label className="btn ghost">Import CSV<input aria-label="Import recognition CSV" type="file" accept="text/csv" hidden onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; void file.text().then(async (text) => { const imported = parseRecognitionCsv(text); for (const row of imported) await saveRecognition(row); setRecords(await listRecognition()); setNote(`Imported ${imported.length} labeled rows. They are not a live session.`); }); }} /></label>
      <button className="btn ghost" type="button" onClick={() => { if (!window.confirm('Delete recognition responses stored in this browser?')) return; void clearRecognition().then(() => { setRecords([]); setNote('Recognition responses in this browser were cleared.'); }); }}>Clear responses</button>
    </div>
  </section>;
}

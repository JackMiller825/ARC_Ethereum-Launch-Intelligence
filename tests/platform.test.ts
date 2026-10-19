import { describe, expect, it } from 'vitest';
import { parseCandidateList } from '../lib/brand/candidates';
import { parseRecognitionCsv, recognitionSummary, repeatExposure, type RecognitionRecord } from '../lib/brand/recognition';
import { compareBrands } from '../lib/brand/compare';
import { pageBounds, pageSlice, pageWindow } from '../lib/ui/pagination';
import { filterPlayback, playbackIntervalMs, pointAt, prefixAggregates, seekTimestamp, stepTrade, timelineMarkers, withoutTransactions } from '../lib/research/replay';
import type { AnalysisSuccess, Trade } from '../lib/types';

function trade(partial: Partial<Trade>): Trade {
  return {
    id: partial.id || 't', minute: partial.minute ?? 0, timestamp: partial.timestamp ?? 100, wallet: partial.wallet || '0xabc', recipient: '0xabc', side: partial.side || 'BUY', eth: partial.eth ?? 1, ethWei: partial.ethWei || '1000000000000000000', tokenAmount: '1', classification: 'Unknown', confidence: partial.confidence || 'UNKNOWN', evidence: [], score: 1, method: 'swap', isProject: false, assistedExecution: false, valuation: 'weth-pool', protocol: 'v2', pool: partial.pool || '0xpool', txHash: partial.txHash || '0xtx', logIndex: partial.logIndex ?? 0, blockNumber: partial.blockNumber ?? 10, txIndex: 0, origin: 'chain',
  };
}

describe('pagination', () => {
  it('hides a zero range and compacts long page lists', () => {
    expect(pageBounds(1, 10, 0)).toMatchObject({ start: 0, end: 0 });
    expect(pageSlice([1, 2, 3], 2, 2).rows).toEqual([3]);
    expect(pageWindow(5, 12)).toContain('ellipsis');
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
  });
});

describe('historical replay', () => {
  it('seeks, speeds, filters, and refuses to invent a gap', () => {
    const trades = [trade({ id: 'a', timestamp: 100, blockNumber: 10 }), trade({ id: 'b', timestamp: 200, blockNumber: 11, side: 'SELL', txHash: '0xgone' })];
    expect(stepTrade(trades, 0)).toBe(1);
    expect(seekTimestamp(trades, 150)).toBe(1);
    expect(playbackIntervalMs(30)).toBeLessThan(playbackIntervalMs(1));
    expect(pointAt(prefixAggregates(trades), 1).buyWei).toBe(1000000000000000000n);
    expect(withoutTransactions(trades, ['0xgone'])).toHaveLength(1);
    expect(filterPlayback(trades, { sells: false })).toHaveLength(1);
    const snapshot = { coverage: { provisional: true, items: [{ id: 'logs', label: 'Logs', state: 'partial', detail: 'A range was not returned.' }], toBlock: 11 }, audit: [] } as unknown as AnalysisSuccess;
    const markers = timelineMarkers(snapshot, trades);
    expect(markers.some((marker) => marker.kind === 'gap')).toBe(true);
    expect(markers.filter((marker) => marker.kind === 'gap')).toHaveLength(1);
    expect(trades).toHaveLength(2);
  });
});

describe('brand laboratory', () => {
  it('caps candidates, drops duplicates, and does not invent recognition', () => {
    const lines = Array.from({ length: 22 }, (_, index) => `Name ${index}|T${index}`);
    lines.push('Name 1|T1');
    const parsed = parseCandidateList(lines.join('\n'));
    expect(parsed.inputs).toHaveLength(20);
    expect(parsed.overflow).toBe(2);
    expect(parsed.duplicates).toHaveLength(1);
    expect(compareBrands(parsed.inputs.slice(0, 20), { now: 1 }).rows).toHaveLength(20);
    const empty = recognitionSummary({ name: 'North', ticker: 'NTH' }, []);
    expect(empty.exactName).toBeNull();
    const row: RecognitionRecord = { id: '1', sessionId: 's', participantId: 'p', candidateId: 'c', stimulusVersion: 'v', exposureMs: 5000, displayedMs: 5000, name: 'North', ticker: 'NTH', meaning: 'a direction', clarity: 4, memorability: 3, completedAt: 1, interrupted: false, source: 'local-session' };
    const summary = recognitionSummary({ name: 'North', ticker: 'NTH' }, [row, { ...row, id: '2', interrupted: true, name: '' }]);
    expect(summary.n).toBe(1);
    expect(summary.exactTicker).toBe(1);
    expect(summary.note).toMatch(/too small/i);
    expect(repeatExposure([row], 'c', 'p')).toBe(true);
    const imported = parseRecognitionCsv(`source,session_id,participant_id,candidate_id,stimulus_version,exposure_ms,displayed_ms,name,ticker,meaning,clarity,memorability,completed_at,interrupted\nimported,s,p,c,v,5000,5000,North,NTH,direction,4,3,1,false`);
    expect(imported[0].source).toBe('imported');
  });
});

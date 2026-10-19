import type { BrandAnalysis, ComparisonSession } from './types';

export function createMemoryBrandStore() {
  const analyses = new Map<string, BrandAnalysis>();
  const sessions = new Map<string, ComparisonSession>();
  return {
    saveAnalysis(record: BrandAnalysis) {
      analyses.set(record.id, record);
    },
    listAnalyses() {
      return [...analyses.values()].sort((a, b) => b.analyzedAt - a.analyzedAt);
    },
    saveSession(record: ComparisonSession) {
      sessions.set(record.id, record);
    },
    listSessions() {
      return [...sessions.values()];
    },
  };
}

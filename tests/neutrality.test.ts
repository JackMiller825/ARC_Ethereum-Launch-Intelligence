import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { GLOSSARY } from '../lib/help/glossary';
import { ARTICLES, articleById } from '../lib/help/articles';
import { FEATURES, featureById } from '../lib/features/registry';
import { hashSources } from '../lib/features/review';
import { defaultPlaybook, defaultSettings } from '../lib/store/idb';
import { sampleTokens } from '../lib/data';
import { matchingSnapshot, existingTokenId, futureCandidateId } from '../lib/token/identity';
import { analyzeBrand } from '../lib/brand/score';
import reviewLock from '../lib/features/review-lock.json';

const BANNED = /sish|0xe6f94f305ce2a00219fd4d476aa79f37304ffe8b/i;
const ROOTS = ['app', 'components', 'lib', 'docker-compose.yml', '.env.example'];

function files(path: string): string[] {
  const info = statSync(path);
  if (info.isFile()) return [path];
  return readdirSync(path).flatMap((name) => files(join(path, name)));
}

describe('token neutrality', () => {
  it('keeps the shipped app free of the legacy example token', () => {
    const hits = ROOTS.flatMap(files).filter((path) => /\.(ts|tsx|js|mjs|yml|json|css|md|example)$/.test(path) || path.endsWith('.env.example')).filter((path) => BANNED.test(readFileSync(path, 'utf8')));
    expect(hits).toEqual([]);
  });

  it('starts with an empty contract, name, and ticker', () => {
    const playbook = defaultPlaybook();
    expect(playbook.tokenName).toBe('');
    expect(playbook.ticker).toBe('');
    expect(playbook.plannedAddress).toBe('');
    expect(playbook.tokenAddress).toBe('');
    expect(defaultSettings.demoMode).toBe(false);
    expect(sampleTokens.some((token) => BANNED.test(`${token.name} ${token.symbol} ${token.address}`))).toBe(false);
  });

  it('does not keep the previous token when the address changes, and future mode needs no contract', () => {
    const active = { token: { address: '0x1111111111111111111111111111111111111111' } };
    expect(matchingSnapshot(active, '')).toBeNull();
    expect(matchingSnapshot(active, '0x2222222222222222222222222222222222222222')).toBeNull();
    expect(matchingSnapshot(active, active.token.address)?.token.address).toBe(active.token.address);
    const future = analyzeBrand({ name: 'Pebble Finch', ticker: 'PBLF', mode: 'future' }, { now: 1 });
    expect(future.input.address).toBeUndefined();
    expect(futureCandidateId('local-1')).toBe('candidate:local-1');
    expect(existingTokenId(1, '0x1111111111111111111111111111111111111111')).toBe('1:0x1111111111111111111111111111111111111111');
  });
});

describe('documentation consistency', () => {
  it('gives every registered feature a real article, route, and glossary entry', () => {
    const shell = readFileSync('components/shell.tsx', 'utf8');
    const tips = ['components', 'app'].flatMap(files).filter((path) => path.endsWith('.tsx')).flatMap((path) => [...readFileSync(path, 'utf8').matchAll(/(?:HelpTip id|helpId)="([^"]+)"/g)].map((match) => match[1]));
    expect(tips.length).toBeGreaterThan(0);
    for (const id of tips) expect(GLOSSARY[id]?.article && articleById(GLOSSARY[id].article)).toBeTruthy();
    for (const feature of FEATURES) {
      expect(articleById(feature.helpArticleId)?.availability).toBe(feature.status);
      const route = feature.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(new RegExp(`href:\\s*'${route}'`).test(shell) || feature.route === '/analysis').toBe(true);
      for (const id of feature.glossaryIds) expect(GLOSSARY[id]?.id).toBe(id);
      for (const related of feature.relatedFeatureIds) expect(featureById(related)?.id).toBe(related);
      expect(feature.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    const helpText = ARTICLES.map((article) => `${article.title} ${article.description} ${article.sections.map((section) => section.body.join(' ')).join(' ')}`).join('\n');
    expect(helpText).not.toMatch(BANNED);
  });

  it('requires a review decision when a feature source changes', () => {
    const lock = reviewLock as Record<string, { hash: string; decision: string; note: string }>;
    for (const feature of FEATURES) {
      const recorded = lock[feature.id];
      expect(recorded?.decision === 'updated' || recorded?.decision === 'unchanged').toBe(true);
      expect(recorded.note.length).toBeGreaterThan(8);
      expect(recorded.hash).toBe(hashSources(feature.sources));
    }
  });
});

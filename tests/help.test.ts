import { describe, expect, it } from 'vitest';
import { ARTICLES, CATEGORIES, articleById } from '../lib/help/articles';
import { GLOSSARY } from '../lib/help/glossary';
import { highlightParts, searchArticles } from '../lib/help/search';
import { TOURS } from '../lib/help/tours';
import { INTERVALS } from '../lib/intervals';

describe('help center', () => {
  it('covers every category and keeps related links real', () => {
    for (const category of CATEGORIES) expect(ARTICLES.some((article) => article.category === category)).toBe(true);
    for (const article of ARTICLES) {
      expect(article.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const id of article.related) expect(articleById(id)?.id).toBe(id);
    }
  });

  it('points glossary entries at articles and keeps the SISH example', () => {
    for (const entry of Object.values(GLOSSARY)) expect(articleById(entry.article)?.id).toBe(entry.article);
    const start = articleById('getting-started');
    expect(start?.sections.some((section) => section.body.some((line) => line.includes('0xe6f94f305ce2a00219fd4d476aa79f37304ffe8b')))).toBe(true);
  });

  it('ranks a title match ahead of a body mention and returns nothing for noise', () => {
    const hits = searchArticles(ARTICLES, 'getting started');
    expect(hits[0]?.article.id).toBe('getting-started');
    expect(searchArticles(ARTICLES, 'sniper')[0]?.article.id).toBe('bot-intelligence');
    expect(searchArticles(ARTICLES, 'dexscreener')[0]?.article.id).toBe('faq');
    expect(searchArticles(ARTICLES, 'zzzz-not-a-metric')).toEqual([]);
  });

  it('highlights without dropping the surrounding text', () => {
    const parts = highlightParts('Gross ETH buy volume', 'eth');
    expect(parts.filter((part) => part.match).map((part) => part.text.toLowerCase())).toEqual(['eth']);
    expect(parts.map((part) => part.text).join('')).toBe('Gross ETH buy volume');
  });

  it('lists every interval in the interval guide and gives tours a real route', () => {
    const text = articleById('intervals')?.sections.map((section) => section.body.join(' ')).join(' ') || '';
    for (const interval of INTERVALS) expect(text).toContain(interval);
    expect(text).toContain('Custom');
    for (const tour of TOURS) {
      expect(tour.steps.length).toBeGreaterThan(0);
      for (const step of tour.steps) expect(step.href.startsWith('/')).toBe(true);
    }
  });
});

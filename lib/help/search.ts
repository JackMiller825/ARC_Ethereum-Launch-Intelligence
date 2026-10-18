import type { Article } from './articles';

export type SearchHit = { article: Article; score: number; snippet: string };

function fold(value: string) {
  return value.toLowerCase();
}

export function searchArticles(articles: Article[], query: string): SearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const hits: SearchHit[] = [];
  for (const article of articles) {
    let score = 0;
    const title = fold(article.title);
    const description = fold(article.description);
    const keys = article.keywords.map(fold).join(' ');
    const body = article.sections.map((section) => `${section.heading} ${section.body.join(' ')}`).join(' ');
    const folded = fold(body);
    if (title.includes(needle)) score += 12;
    if (description.includes(needle)) score += 6;
    if (keys.includes(needle)) score += 5;
    const at = folded.indexOf(needle);
    if (at >= 0) score += 3;
    if (!score) continue;
    const start = Math.max(0, at < 0 ? 0 : at - 40);
    const snippet = (at < 0 ? article.description : body.slice(start, start + 140)).replace(/\s+/g, ' ').trim();
    hits.push({ article, score, snippet });
  }
  return hits.sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title));
}

export function highlightParts(text: string, query: string) {
  const needle = query.trim();
  if (!needle) return [{ text, match: false }];
  const expression = new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
  return text.split(expression).filter((part) => part !== '').map((part) => ({ text: part, match: part.toLowerCase() === needle.toLowerCase() }));
}

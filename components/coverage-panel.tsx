"use client";
import Link from 'next/link';
import { ARTICLES } from '@/lib/help/articles';
import { GLOSSARY } from '@/lib/help/glossary';
import { TOURS } from '@/lib/help/tours';
import { documentationCoveragePct, documentationStatus } from '@/lib/features/coverage';
import { FEATURES } from '@/lib/features/registry';
import { COMMIT_SHA, shortSha } from '@/lib/build-info';

export function CoveragePanel() {
  const rows = documentationStatus(FEATURES, ARTICLES, GLOSSARY, TOURS);
  const pct = documentationCoveragePct(rows);
  return <section className="panel"><div className="panel-eyebrow">DOCUMENTATION</div><h3>Documentation coverage {pct}%</h3><p className="panel-desc">Complete features divided by {FEATURES.length} registered features. A feature is complete only when its article exists, availability matches, glossary links resolve, and the article date is not older than the review date. Build {shortSha(COMMIT_SHA)}.</p>{rows.map((row) => {
    const feature = FEATURES.find((item) => item.id === row.id);
    const label = feature?.status === 'planned' ? 'Planned' : row.missingArticle ? 'Missing' : row.outdated || row.availabilityMismatch || row.brokenGlossary.length ? 'Needs review' : 'Complete';
    return <Link key={row.id} className="coverage-row" href={`/help?article=${feature?.helpArticleId || 'documentation-coverage'}`}><span>{feature?.name || row.id}</span><span>{label}{row.missingTour ? ' · no tour' : ''}</span></Link>;
  })}</section>;
}

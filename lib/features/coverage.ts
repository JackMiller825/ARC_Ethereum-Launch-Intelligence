import type { Article } from '../help/articles';
import type { GlossaryEntry } from '../help/glossary';
import type { Tour } from '../help/tours';
import type { FeatureDefinition } from './registry';

export type FeatureDocStatus = {
  id: string;
  complete: boolean;
  missingArticle: boolean;
  availabilityMismatch: boolean;
  brokenGlossary: string[];
  outdated: boolean;
  missingTour: boolean;
};

export function documentationStatus(features: FeatureDefinition[], articles: Article[], glossary: Record<string, GlossaryEntry>, tours: Tour[]): FeatureDocStatus[] {
  return features.map((feature) => {
    const article = articles.find((item) => item.id === feature.helpArticleId);
    const brokenGlossary = feature.glossaryIds.filter((id) => !glossary[id]);
    const missingTour = !tours.some((tour) => tour.steps.some((step) => step.href === feature.route || step.href.startsWith(`${feature.route}?`)));
    const outdated = Boolean(article && article.updated < feature.lastReviewed);
    const availabilityMismatch = Boolean(article && article.availability !== feature.status);
    const missingArticle = !article;
    const complete = !missingArticle && !availabilityMismatch && brokenGlossary.length === 0 && !outdated;
    return { id: feature.id, complete, missingArticle, availabilityMismatch, brokenGlossary, outdated, missingTour };
  });
}

/** Complete features divided by registered features. A feature is complete only when its article exists, the availability matches, glossary ids resolve, and the article date is not older than lastReviewed. */
export function documentationCoveragePct(rows: FeatureDocStatus[]) {
  if (!rows.length) return 0;
  return Math.round((rows.filter((row) => row.complete).length / rows.length) * 100);
}

import { criterionById } from './rubric';
import type { BrandAnalysis, BrandReport, ComparisonSession } from './types';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}

export function editorialReport(analysis: BrandAnalysis): BrandReport {
  const weak = [...analysis.criteria].filter((item) => item.status === 'scored' && item.score !== null && item.score <= 4).sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 3);
  const name = analysis.input.name || 'This name';
  const ticker = analysis.input.ticker || 'the ticker';
  const cite = (id: string) => {
    const item = analysis.criteria.find((entry) => entry.id === id);
    return item ? `${criterionById(id).title} (${id}${item.score === null ? ', not scored' : `, ${item.score}/10`})` : id;
  };
  const summary = [
    `${name} reads, at a glance, through ${cite('fi-01')} and ${cite('fi-02')}.`,
    `${ticker} is read through ${cite('tq-01')} and ${cite('tq-05')}.`,
    analysis.collisions.length ? `Collision records: ${analysis.collisions.slice(0, 3).map((item) => `${item.matchType} with ${item.matchedName} (${item.source})`).join('; ')}.` : 'No collision was recorded in the sources that actually ran.',
    weak.length ? `First problems to look at: ${weak.map((item) => cite(item.id)).join('; ')}.` : 'No scored factor is at 4/10 or below. Unknown items are still not clearances.',
    'A newcomer only has the words. A memecoin reader may also recognize a meme-list hit. Neither reading is a measured audience study.',
  ];
  const advanced = analysis.criteria.map((item) => {
    const definition = criterionById(item.id);
    return `${definition.title} (${item.id}): ${item.status}${item.score === null ? '' : ` ${item.score}/10`}. ${item.rationale}`;
  });
  return { title: `${name} / ${ticker || '—'}`, summary, advanced, limitations: analysis.limitations };
}

export function analysisToJson(analysis: BrandAnalysis) {
  return JSON.stringify(analysis, null, 2);
}

export function analysisToCsv(analysis: BrandAnalysis) {
  const lines = ['id,title,status,score,risk_severity,sufficiency,evidence,rationale'];
  for (const item of analysis.criteria) {
    const definition = criterionById(item.id);
    lines.push([item.id, definition.title, item.status, item.score ?? '', item.riskSeverity ?? '', item.sufficiency, item.evidence, item.rationale].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
  }
  lines.push(`"rubric","${analysis.rubricVersion}","","","","","",""`);
  return lines.join('\n');
}

export function comparisonToCsv(session: ComparisonSession) {
  const header = ['rank', 'name', 'ticker', 'overall', 'coverage', 'label', 'collisions', 'warning'];
  const lines = [header.join(',')];
  for (const row of session.rows) {
    lines.push([row.rank, row.name, row.ticker, row.overall ?? '', row.coverage, row.label, row.collisions.length, row.warning].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
  }
  lines.push(`"rubric","${session.rubricVersion}"`);
  return lines.join('\n');
}

export function analysisToHtml(analysis: BrandAnalysis) {
  const report = editorialReport(analysis);
  const rows = analysis.categories.map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${item.score ?? 'Insufficient'}</td><td>${item.coverage}%</td><td>${item.weight}%</td></tr>`).join('');
  const factors = analysis.criteria.map((item) => `<li><strong>${escapeHtml(criterionById(item.id).title)}</strong> — ${item.score ?? item.status}. ${escapeHtml(item.rationale)}</li>`).join('');
  const collisions = analysis.collisions.map((item) => `<li>${escapeHtml(item.matchType)}: ${escapeHtml(item.matchedName)} (${escapeHtml(item.matchedTicker)}) via ${escapeHtml(item.source)}${item.url ? ` — ${escapeHtml(item.url)}` : ''}</li>`).join('') || '<li>None recorded in the sources that ran.</li>';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.title)}</title><style>body{font:15px/1.5 sans-serif;max-width:820px;margin:32px auto;color:#111}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;text-align:left}</style></head><body><h1>${escapeHtml(report.title)}</h1><p>Editorial score: ${analysis.overall ?? 'Insufficient information'} / 10. Coverage ${analysis.coverage}%. Rubric ${analysis.rubricVersion}. Profile ${analysis.profileId}. ${analysis.input.address ? `Contract ${escapeHtml(analysis.input.address)}.` : 'No contract was required.'}</p><p>${report.summary.map(escapeHtml).join('</p><p>')}</p><h2>Categories</h2><table><tr><th>Category</th><th>Score</th><th>Coverage</th><th>Weight</th></tr>${rows}</table><h2>Factors</h2><ol>${factors}</ol><h2>Collisions</h2><ul>${collisions}</ul><h2>Limitations</h2><ul>${analysis.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul><p>Subjective scores are not verified market outcomes. Research time: ${analysis.analyzedAt ? new Date(analysis.analyzedAt).toISOString() : 'not set'}.</p></body></html>`;
}

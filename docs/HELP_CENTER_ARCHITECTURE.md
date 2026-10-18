# Help center architecture

The Help route is `/help`. Next.js `basePath` and `trailingSlash` keep it on GitHub Pages under `/ARC_Ethereum-Launch-Intelligence/help/`.

## Content

Typed articles live in `lib/help/articles.ts`. Each article has an id, title, category, description, keywords, related ids, updated date, availability (`available`, `limited`, or `planned`), and sections. Adding a guide means appending one object. The sidebar and cards read `CATEGORIES` and `ARTICLES`, so a new category is one string plus one article.

`lib/help/glossary.ts` is the single definition used by metric tooltips and the metrics article. `lib/help/search.ts` ranks title, then description, keywords, then body. It runs in the browser with no search service. `lib/help/tours.ts` lists guided steps and stores completion in `localStorage` under `arc-help-tours`. Tours do not auto-start.

## UI

`app/help/page.tsx` is the homepage, search, article layout, and tour restart links. `components/help-tip.tsx` is the question-mark popover. `components/tour.tsx` is mounted from the shell and only appears when the URL has `?tour=`. `components/indexing-progress.tsx` maps indexer stage names onto the eight analysis steps.

The shell SYSTEM group links to Data & Settings and Help & Documentation. The top bar has a Help icon.

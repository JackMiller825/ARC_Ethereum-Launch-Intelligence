# UI components

Shared pieces live in `components/`. Pages do not each rebuild the sidebar or metric card.

| Piece | Where | Role |
|---|---|---|
| `Shell` | `components/shell.tsx` | Sidebar, top bar, version notice, workspace provider |
| `MetricTile` | `components/ui.tsx` | KPI card. Optional `href` makes the whole card a link |
| `TimeRangeSelector` | `components/ui.tsx` | Launch, rolling, and absolute windows plus presets |
| `TrendChart` | `components/ui.tsx` | Cumulative buy and sell paths. Legend buttons hide a series |
| `TradeTable` | `components/ui.tsx` | Side filter, windowed rows, Etherscan links |
| `ExportButton` / `ExportJson` | `components/ui.tsx` | CSV and JSON downloads |
| `ContractSearchHero` | `components/visual.tsx` | Analyzer search panel |
| `IntelligenceNetwork` | `components/visual.tsx` | SVG core with buttons. Decorative only if `onPick` is omitted |
| `LiveMonitor` | `components/monitor.tsx` | Existing tail, refresh modes, and alerts |

Design tokens are the CSS variables in `app/globals.css`. There is no separate component library package.

Not built as standalone files: a generic virtualized data grid, a PDF renderer, and a Framer Motion wrapper. Tables scroll inside their own containers. The trade table still windows 24 rows from scroll position.

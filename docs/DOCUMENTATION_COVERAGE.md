# Documentation coverage

Reviewed 2026-10-19. Each row is a feature in `lib/features/registry.ts`.

| Feature | Route | Status | Help article |
|---|---|---|---|
| Overview | `/` | available | getting-started |
| Token Analyzer | `/analysis` | available | token-analyzer |
| Name & Ticker Analyzer | `/brand-intelligence` | available | brand-intelligence |
| Launch Planner | `/planner` | limited | launch-planner |
| Bot Intelligence | `/bots` | available | bot-intelligence |
| Wallet Explorer | `/wallets` | available | wallet-explorer |
| Token History | `/history` | available | token-history |
| Data & Settings | `/settings` | limited | rpc |
| Help | `/help` | available | getting-started |
| Time intervals | `/analysis` | available | intervals |
| Coverage | `/analysis` | available | coverage |
| Launch Laboratory | `/laboratory` | available | launch-laboratory |
| Research Assistant | `/analysis` | limited | research-assistant |
| Documentation Coverage | `/help` | available | documentation-coverage |

Glossary ids cited by those features resolve in `lib/help/glossary.ts`, including `recognition`. The brand article covers existing-token, future-token, comparison of up to 20 candidates, coverage, collisions, suggestions, and the recognition workspace. The form starts empty.

`tests/research.test.ts` requires documentation coverage of 100% under the formula in `lib/features/coverage.ts`. The Help home and Data & Settings both render that panel. A missing tour is listed and does not change the percentage.

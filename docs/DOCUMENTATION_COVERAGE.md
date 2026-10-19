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

Glossary ids cited by those features resolve in `lib/help/glossary.ts`. The brand article covers existing-token, future-token, comparison, coverage, collisions, and suggestions. It states that the form starts empty.

Intervals, bots, wallets, and the planner were not behavior-changed in this pass beyond the empty-start copy, so their articles stay as previously published except where a sample contract was removed.

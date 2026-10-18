# ARC violet terminal

Visual redesign recorded 2026-10-18. The analyzer, indexer, heuristics, and storage paths are unchanged. The interface uses the existing Next.js app, Lucide icons, and the hand-built chart. Framer Motion was not added.

## Color and type

Background `#080817`, sidebar `#0D0D20`, surfaces `#111126` / `#17172F` / `#211A3E`. Violet `#8B5CF6`, bright `#A78BFA`, lavender `#C4B5FD`. Text `#F8F7FF`, secondary `#A4A3BF`, muted `#74748E`. Buy `#36D6A0`, sell `#FB7185`, warning `#F4BB64`. Borders use `rgba(179, 163, 255, 0.11)`.

Plus Jakarta Sans for headings, Inter for interface text, JetBrains Mono for addresses and figures. Market numbers use tabular numerals.

## Shell

Fixed 260px sidebar with WORKSPACE, RESEARCH, and SYSTEM groups. The footer shows RPC source, last indexed block, freshness, health, and the short commit. The top bar shows the page, the open token, a contract shortcut, indexer stage, notification permission, and settings. Below 850px the sidebar becomes a slide-out drawer. A published-commit mismatch still offers a reload.

## Pages

Overview keeps the live snapshot and adds sell volume, trade count, stored liquidity, and coverage cards. Empty values stay em dashes.

Token Analyzer uses the search hero and the SVG intelligence map. Node buttons switch the analysis tabs: Overview, Transactions, Liquidity, Wallets, Bot Activity, Contract, and Data Quality. Indexing progress, intervals, exports, and the live tail stay on the page.

Bot Intelligence lists the existing evidence classes and shows automated buy, sell, share, and the unknown band from the stored snapshot. A class filters the supporting trades. Labels remain evidence, not identities.

Wallet Explorer keeps the signer table, balance read, Blockscout funding read, copy, Etherscan links, and a vertical timeline.

Token History adds search and a sortable library table on top of the existing cards, favorites, comparison, and batch queue.

Launch Planner keeps the same checklist items and scenario math, with a stepper that scrolls to each section. Scenario numbers are labeled as inputs, not forecasts.

Settings keeps RPC, demo mode, methodology, and version check, and exposes the existing buy, sell, and coverage alert thresholds as browser-only values.

## Motion

Hover and color changes use about 160–220ms. The hero scan ring is a CSS rotation of a dashed circle. `prefers-reduced-motion: reduce` disables animation and transitions. KPI values are not counted up.

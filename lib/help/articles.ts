export type Availability = 'available' | 'limited' | 'planned';

export type ArticleSection = { heading: string; body: string[] };

export type Article = {
  id: string;
  title: string;
  category: string;
  description: string;
  keywords: string[];
  related: string[];
  updated: string;
  availability: Availability;
  sections: ArticleSection[];
};

const UPDATED = '2026-10-18';
const SISH = '0xe6f94f305ce2a00219fd4d476aa79f37304ffe8b';

export const CATEGORIES = [
  'Getting Started',
  'Token Analyzer',
  'Bot Intelligence',
  'Wallet Explorer',
  'Launch Planner',
  'Token History',
  'Trading Metrics & Formulas',
  'Time Intervals',
  'Data Accuracy & Coverage',
  'RPC & Connectivity',
  'Troubleshooting',
  'Frequently Asked Questions',
] as const;

export const ARTICLES: Article[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    category: 'Getting Started',
    description: 'Paste a contract, choose a window, and read the first result without treating estimates as identities.',
    keywords: ['tutorial', 'sish', 'onboarding', 'first analysis'],
    related: ['token-analyzer', 'intervals', 'metrics'],
    updated: UPDATED,
    availability: 'available',
    sections: [
      { heading: 'Who this is for', body: ['Anyone researching an Ethereum ERC-20 launch. ARC does not ask you to connect a wallet and it does not buy tokens.'] },
      { heading: 'Nine steps', body: [
        'Open Token Analyzer.',
        'Paste an Ethereum ERC-20 contract address.',
        'Select an analysis period: since launch, rolling, or an absolute UTC range.',
        'Run Analyze Token. Progress follows completed indexer stages, not a decorative timer.',
        'Read gross buy, gross sell, net ETH flow, liquidity, and unique signer counts.',
        'Open Bot Intelligence for evidence classes. Unknown is a real bucket.',
        'Open Wallet Explorer for one signer’s chronology and Etherscan link.',
        'Save happens in this browser. Compare tokens on Token History.',
        'Use an indexed token as a baseline in Launch Planner. The planner does not predict buyers.',
      ] },
      { heading: 'Try with $SISH', body: [`Example contract ${SISH}. It is a real reference address, not a promise that public RPCs will finish every window. Live totals appear only after logs are indexed. Synthetic demo fixtures stay off unless you enable them in Settings.`] },
      { heading: 'Common mistake', body: ['Leaving the interval on a short preset and then comparing it with a site that shows all-time volume. Different windows produce different totals.'] },
    ],
  },
  {
    id: 'token-analyzer',
    title: 'Token Analyzer',
    category: 'Token Analyzer',
    description: 'Contract search, pool discovery, swap indexing, and the tabbed result.',
    keywords: ['analyze', 'contract', 'pools', 'tabs', 'export'],
    related: ['intervals', 'coverage', 'metrics'],
    updated: UPDATED,
    availability: 'available',
    sections: [
      { heading: 'Purpose', body: ['Investigate one ERC-20. The page validates the address, reads metadata, discovers Uniswap V2, V3, and V4 pools, indexes swap logs, reconstructs economic trades, and shows coverage.'] },
      { heading: 'Controls', body: ['The search accepts a 0x address. Recent saved tokens are shortcuts. Window mode is since launch, rolling, or absolute. Presets run from 1 minute to 30 days, with the rest under More, plus Custom minutes. Changing the view recomputes KPIs from the stored trades. A longer range than the snapshot is labeled partial until you re-index.'] },
      { heading: 'Tabs', body: ['Overview, Transactions, Liquidity, Wallets, Bot Activity, Contract, and Data Quality. Exports are CSV, JSON, and printer-friendly HTML. There is no PDF export.'] },
      { heading: 'Live tail', body: ['Check now, or refresh manually, about every block, 15s, 30s, 1m, or 5m. The interval does not change Ethereum block time or finality. Closing the tab stops watching. That is not 24/7 monitoring.'] },
      { heading: 'Limitation', body: ['GitHub Pages serves the static app. Indexing runs in the browser against the RPC list. A hosted worker is not part of the Pages deploy.'] },
    ],
  },
  {
    id: 'bot-intelligence',
    title: 'Bot intelligence',
    category: 'Bot Intelligence',
    description: 'Evidence classes, confidence, and why unknown volume stays visible.',
    keywords: ['sniper', 'mev', 'sandwich', 'market maker', 'confidence', 'heuristic'],
    related: ['metrics', 'wallet-explorer', 'faq'],
    updated: UPDATED,
    availability: 'available',
    sections: [
      { heading: 'What ARC can say', body: ['arc-heuristic-v2 attaches an evidence class and HIGH, MEDIUM, LOW, or UNKNOWN. HIGH and MEDIUM valued buys and sells enter the automated estimate. LOW, including the market-making hint, stays out. Unknown is not filled in to reach a target share.'] },
      { heading: 'Liquidity snipers', body: ['Detection: a buy in the T0 block or the next block. That is speed evidence, not the name of an operator. False positive: a manual buyer who was simply ready.'] },
      { heading: 'New-pair scanners', body: ['Detection: an early buy in the first minutes without a faster sniper pattern. Timing alone stays low confidence.'] },
      { heading: 'Copy trading', body: ['Detection: repeated buys within two blocks of the same leader wallet. A shared public mempool can imitate a follower.'] },
      { heading: 'Momentum', body: ['Detection: several buys from one signer across the window without a faster pattern. A person clicking repeatedly can look the same.'] },
      { heading: 'Arbitrage', body: ['Detection: a round trip inside 120 seconds. Often inventory-neutral rather than new demand.'] },
      { heading: 'MEV and sandwiches', body: ['Sandwich: a same-block buy and sell surrounding another buy. MEV here means a same-block inventory flip without a surrounded victim. Neither label names a searcher firm.'] },
      { heading: 'Market making', body: ['Both sides, at least four trades, and more than three minutes. This hint is LOW so it does not enter the automated KPI.'] },
      { heading: 'Autonomy versus assistance', body: ['A router call from an externally owned account is assisted execution. It is not proof the signer is a bot, and it is not proof a bot made the decision. ARC does not identify a human operator.'] },
    ],
  },
  {
    id: 'wallet-explorer',
    title: 'Wallet Explorer',
    category: 'Wallet Explorer',
    description: 'Signer drill-down, timeline, balance, and funding reads.',
    keywords: ['wallet', 'etherscan', 'funding', 'timeline'],
    related: ['bot-intelligence', 'token-analyzer'],
    updated: UPDATED,
    availability: 'available',
    sections: [
      { heading: 'Purpose', body: ['Inspect signers from the open snapshot. Filter by address or class. The drill-down shows method, assisted-execution flag, evidence lines, and a buy/sell timeline.'] },
      { heading: 'External reads', body: ['Read balance calls eth_getBalance on a public RPC. Read Blockscout activity shows the first transaction page when Blockscout answers. A funding source is not inferred if that call fails. Exchange funding is not treated as shared control.'] },
      { heading: 'Labels', body: ['Mark project or independent applies on the next index. Re-analyze after changing a label. Addresses truncate on small screens and copy in full.'] },
      { heading: 'Limitation', body: ['Related launches are other tokens saved in this browser that share the signer. That is a weak association, not common ownership.'] },
    ],
  },
  {
    id: 'launch-planner',
    title: 'Launch Planner',
    category: 'Launch Planner',
    description: 'A checklist and hypothetical liquidity math. Not a forecast and not a buyer.',
    keywords: ['planner', 'slippage', 'scenario', 'checklist'],
    related: ['token-history', 'metrics'],
    updated: UPDATED,
    availability: 'limited',
    sections: [
      { heading: 'Purpose', body: ['Prepare a launch checklist and compare a scenario with an indexed token if you select one. Inputs include name, ticker, supply, ETH liquidity, token allocation, pool type, window, operational budget, and a gross-buy research target.'] },
      { heading: 'What the numbers are', body: ['Modeled bot buy is your assumed share of your gross-buy goal. It is not observed demand. V2 what-if rows are constant-product impact versus the spot reserve, 30 bps fee, labeled hypothetical. V3 and V4 concentrated liquidity are not simulated with that curve.'] },
      { heading: 'Gas', body: ['Read gas fetches eth_gasPrice and an ETH-USD spot print for context. No launch minute is recommended from that print.'] },
      { heading: 'Limitation', body: ['The planner does not buy, sell, or manufacture volume. It does not predict price.'] },
    ],
  },
  {
    id: 'token-history',
    title: 'Token History',
    category: 'Token History',
    description: 'IndexedDB snapshots, favorites, batch jobs, and T0-aligned comparison.',
    keywords: ['history', 'compare', 'batch', 'favorite', 'csv'],
    related: ['token-analyzer', 'launch-planner'],
    updated: UPDATED,
    availability: 'available',
    sections: [
      { heading: 'Purpose', body: ['One saved snapshot per contract in this browser. Search, favorite, and add tokens to a comparison. The table aligns each token to its own T0 for 1, 5, 15, 30, 60, 360, or 1440 minutes.'] },
      { heading: 'Batch', body: ['Paste up to 10 addresses or a CSV. Jobs run one at a time so they do not cancel each other. A failure keeps the other rows.'] },
      { heading: 'Correlation', body: ['Pearson r of gross buy and buyer count appears only for three or more tokens, with a note that correlation is not causation.'] },
      { heading: 'Limitation', body: ['Clear local history deletes snapshots, the playbook, and labels in this browser. It does not touch mainnet. A Postgres worker is separate and is not running on GitHub Pages.'] },
    ],
  },
  {
    id: 'metrics',
    title: 'Trading metrics and formulas',
    category: 'Trading Metrics & Formulas',
    description: 'Gross versus net, wallets versus humans, and metrics ARC does not invent.',
    keywords: ['gross', 'net', 'market cap', 'fdv', 'slippage', 'gas', 'retention'],
    related: ['coverage', 'bot-intelligence', 'intervals'],
    updated: UPDATED,
    availability: 'available',
    sections: [
      { heading: 'Gross ETH buying volume', body: ['Sum of valued independent buy wei, displayed in ETH. Project wallets and routes without a WETH hop are excluded. Example: 1.5 ETH plus 0.5 ETH from two independent buys is 2.0 ETH gross buy.'] },
      { heading: 'Gross ETH selling volume', body: ['The same rule on the sell side. Liquidity burns are not sells.'] },
      { heading: 'Net ETH trading flow', body: ['Gross buy wei minus gross sell wei. If buys are 2.0 ETH and sells are 0.5 ETH, net flow is 1.5 ETH. Gross can exceed net because ETH turns over.'] },
      { heading: 'Buy/sell ratio', body: ['Not a headline KPI. You can compare the two gross figures. A ratio is not a forecast.'] },
      { heading: 'Automated estimates', body: ['HIGH plus MEDIUM evidence only. Share is automated buy divided by valued independent buy, when the denominator is non-zero.'] },
      { heading: 'Unique wallets and concentration', body: ['Unique buyers are distinct signers. Concentration, when present, is a share of valued buy among the largest signers. Neither is a count of people.'] },
      { heading: 'Early buyer retention', body: ['Share of independent buyers with no sell in the same window. A missing sell is not a holding commitment.'] },
      { heading: 'Liquidity, price impact, slippage', body: ['Initial ETH-side liquidity is shown when a mint can be reconstructed. Planner price impact is a V2 constant-product scenario in basis points, hypothetical. Slippage you experience in a wallet is not simulated.'] },
      { heading: 'Market cap and FDV', body: ['Limited availability. ARC does not fetch a spot price to compute market capitalization or fully diluted valuation. Those figures are omitted rather than estimated.'] },
      { heading: 'Gas, T0, and confirmations', body: ['Gas on a trade is stored when the transaction receipt includes it. T0 is the first public swap after liquidity, with block and UTC timestamp. Confirmations are the distance from the indexed tip toward the chain head. The live tail does not treat a refresh click as finality.'] },
      { heading: 'Trade valuation', body: ['weth-pool and multihop-weth are valued. Unsupported routes stay unvalued and are listed, not filled with a price guess. ERC-20 transfer counts are not swap volume.'] },
    ],
  },
  {
    id: 'intervals',
    title: 'Time intervals',
    category: 'Time Intervals',
    description: 'Launch-relative, rolling, and absolute windows from 1 minute through 30 days.',
    keywords: ['1m', '30d', 'utc', 'custom', 'rolling', 't0'],
    related: ['token-analyzer', 'coverage'],
    updated: UPDATED,
    availability: 'available',
    sections: [
      { heading: 'Launch-relative', body: ['Starts at the first verified public swap (T0) and runs for the selected minutes. A 5 minute window and a 1 hour window on the same token will not match.'] },
      { heading: 'Rolling', body: ['The selected duration ending at the chain tip used for that run. It moves when you index again.'] },
      { heading: 'Absolute', body: ['You pick a start and end. The browser datetime control is local and is converted to UTC. Reports name the UTC bounds.'] },
      { heading: 'Presets', body: ['1m, 3m, 5m, 10m, 15m, 30m, 1h, 2h, 3h, 6h, 12h, 24h, 3d, 7d, 14d, 30d, and Custom up to 30 days of minutes. Frequent presets stay visible. The rest are under More. Nothing is silently capped at 24 hours.'] },
      { heading: 'Incomplete history', body: ['If the saved snapshot is shorter than the selection, figures use the stored window and say so. Re-index to extend. Missing block ranges stay visible. Coverage stays under 100% when a warning remains.'] },
    ],
  },
  {
    id: 'coverage',
    title: 'Data accuracy and coverage',
    category: 'Data Accuracy & Coverage',
    description: 'How a log becomes a dashboard figure, and why the answer can be incomplete.',
    keywords: ['reorg', 'v2', 'v3', 'v4', 'multihop', 'checkpoint', 'freshness'],
    related: ['rpc', 'metrics', 'troubleshooting'],
    updated: UPDATED,
    availability: 'available',
    sections: [
      { heading: 'Path', body: ['Ethereum blocks are read through an RPC provider. Pool discovery finds V2 pairs, V3 pools, and V4 initialize events. Swap logs are decoded, then transactions are reconstructed into economic trades. Wallets are the signers. Bot classes are evidence labels. The dashboard shows those trades plus coverage.'] },
      { heading: 'Protocols', body: ['V2 uses pair Swap logs. V3 uses pool Swap logs and fee tiers. V4 uses the PoolManager and pool ids. A missed V4 initialize stays a warning instead of a silent success.'] },
      { heading: 'Backfill, checkpoints, reorgs', body: ['Historical ranges are paged. The snapshot stores the tip hash and block bounds. A hash mismatch at the stored tip refuses to append and rolls the checkpoint back using the existing reorg helper. Unconfirmed head data can move.'] },
      { heading: 'Multihop and unsupported routes', body: ['A route that touches WETH counts that WETH once. Routes that cannot be valued in ETH stay separate. They are not approximated from transfer counts.'] },
      { heading: 'Why not 100%', body: ['Warnings, a block cap, a reconciliation mismatch, or a failed signer read keep coverage provisional. That percentage is not a bot-accuracy score.'] },
    ],
  },
  {
    id: 'rpc',
    title: 'RPC and connectivity',
    category: 'RPC & Connectivity',
    description: 'Browser RPC list, public fallbacks, and the worker that Pages does not run.',
    keywords: ['rpc', 'rate limit', 'worker', 'postgres', 'pages'],
    related: ['troubleshooting', 'coverage'],
    updated: UPDATED,
    availability: 'limited',
    sections: [
      { heading: 'Where settings live', body: ['RPC URLs and alert thresholds are stored in this browser. Blank URLs use the public fallbacks. A custom URL may include its own key. Do not paste a seed phrase. ARC never asks for one.'] },
      { heading: 'Status', body: ['Settings can test the first URL and report the head block. The sidebar shows Custom or Public, the last indexed block, and freshness of the open snapshot. Backend status on the version file is not-deployed-with-pages.'] },
      { heading: 'Worker', body: ['Limited availability. Docker Compose and the worker exist for a machine with DATABASE_URL. GitHub Pages cannot run them. worker.observed stays false.'] },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    category: 'Troubleshooting',
    description: 'What common failures mean and how to check that a retry worked.',
    keywords: ['timeout', 'empty', 'rate limit', 'stale', 'wrong address'],
    related: ['rpc', 'coverage', 'intervals'],
    updated: UPDATED,
    availability: 'available',
    sections: [
      { heading: 'RPC request failure or timeout', body: ['The provider rejected or dropped the call. Causes include a bad URL, a dead endpoint, or a brief outage. Test the first URL in Settings. If it fails, remove it or try another line, save, and run the analysis again. Fixed when the test reports a head block and the indexer passes the RPC stage.'] },
      { heading: 'Rate limiting', body: ['Public RPCs throttle getLogs. The indexer retries and can leave gaps. Add your own URL or run a shorter window, then re-index. Fixed when missing ranges drop and the warning list shrinks.'] },
      { heading: 'Missing logs or empty results', body: ['The address may have no V2, V3, or V4 pool in the window, or metadata could not be read. Confirm the contract on Etherscan. An empty valued buy with pools present can mean the quote was not WETH.'] },
      { heading: 'Unsupported pool', body: ['A venue that is not Uniswap V2, V3, or V4 is outside discovery. The page should say so rather than invent volume.'] },
      { heading: 'Incorrect contract address', body: ['Validation requires a 0x-prefixed Ethereum address. A ticker alone is not looked up. Paste the full contract.'] },
      { heading: 'Inconsistent buy and sell totals', body: ['Another site may count transfers, include project wallets, or use a different clock. Compare the same UTC window and remember unvalued routes are excluded.'] },
      { heading: 'Long indexing', body: ['Wide windows and many pools mean more logs and signer reads. The stage list shows blocks scanned. Cancel and use a shorter preset if you only need the open.'] },
      { heading: 'Stale browser data', body: ['Settings → Check published version compares this bundle with version.json. Reload if the commits differ. Hashed assets change with the deploy. The open tab keeps its JavaScript until reload.'] },
      { heading: 'GitHub Pages and the worker', body: ['The site is static. Indexing stops when the tab closes. A green Pages deploy does not mean a server is watching new blocks.'] },
    ],
  },
  {
    id: 'faq',
    title: 'Frequently asked questions',
    category: 'Frequently Asked Questions',
    description: 'Direct answers about chain support, bots, wallets, exports, and the planner.',
    keywords: ['faq', 'dexscreener', 'wallet', 'bug', 'export'],
    related: ['getting-started', 'bot-intelligence', 'launch-planner'],
    updated: UPDATED,
    availability: 'available',
    sections: [
      { heading: 'What is ARC?', body: ['A browser research terminal for Ethereum launch activity. It reconstructs pool swaps and labels evidence. It is not a trading bot.'] },
      { heading: 'Which blockchain?', body: ['Ethereum mainnet. Other chains are not indexed.'] },
      { heading: 'Any ERC-20?', body: ['Any mainnet address the indexer can read. There is no hardcoded requirement that the token is $SISH. The $SISH address is only an example.'] },
      { heading: 'Can ARC identify trading bots?', body: ['It can attach evidence classes. It cannot identify a human operator. Unknown and low-confidence rows stay visible.'] },
      { heading: 'Why is automated buy an estimate?', body: ['Only HIGH and MEDIUM evidence are included, and only when the route has an ETH value. The rest is shown separately.'] },
      { heading: 'Why do metrics differ from DexScreener?', body: ['ARC uses decoded economic swaps in your window, excludes project-labeled wallets, and skips unvalued routes. Other sites use different filters and clocks.'] },
      { heading: 'Do I connect a wallet?', body: ['No. ARC does not request a signature, seed phrase, or private key.'] },
      { heading: 'Does ARC buy tokens?', body: ['No.'] },
      { heading: 'Old tokens?', body: ['Yes, if an RPC can serve the historical logs. Long ranges take longer and may be partial.'] },
      { heading: 'RPC failures?', body: ['The run stops or marks gaps. It does not substitute synthetic trades unless demo mode is on, and demo mode never replaces a live run.'] },
      { heading: 'Coverage below 100%?', body: ['A warning, cap, or reconciliation gap is unresolved. The UI keeps it visible.'] },
      { heading: 'Compare launches?', body: ['Token History aligns saved tokens from each T0. A shorter index is not treated as a full preset.'] },
      { heading: 'Export?', body: ['CSV and JSON from the analyzer, HTML report, and JSON from the planner and comparison. PDF is not generated.'] },
      { heading: 'What does the planner predict?', body: ['Nothing about future buyers or price. It stores your assumptions and can show an indexed baseline beside them.'] },
      { heading: 'How do I report a bug?', body: ['Use the GitHub repository issues for JackMiller825/ARC_Ethereum-Launch-Intelligence. Include the contract, the interval, the commit from Settings, and the indexer warning text. Do not include keys or seed phrases.'] },
    ],
  },
];

export function articleById(id: string) {
  return ARTICLES.find((article) => article.id === id);
}

export function articlesIn(category: string) {
  return ARTICLES.filter((article) => article.category === category);
}

export type Tour = {
  id: string;
  title: string;
  steps: { title: string; body: string; href: string; target?: string }[];
};

export const TOURS: Tour[] = [
  { id: 'first-analysis', title: 'First token analysis', steps: [
    { title: 'Open the analyzer', body: 'Token Analyzer is where a contract is indexed.', href: '/analysis', target: 'ca-search' },
    { title: 'Paste a contract', body: 'Use a full 0x address you chose. The field starts empty.', href: '/analysis', target: 'ca-search' },
    { title: 'Choose a window', body: 'Since launch, rolling, or absolute. Short presets are visible. More holds the rest through 30 days.', href: '/analysis', target: 'interval' },
    { title: 'Read the result', body: 'Gross figures are valued ETH. Net flow is buys minus sells. Coverage under 100% means a gap is still listed.', href: '/analysis' },
  ] },
  { id: 'first-bots', title: 'First bot investigation', steps: [
    { title: 'Open Bot Intelligence', body: 'Classes are evidence labels. Unknown stays unknown.', href: '/bots', target: 'bot-list' },
    { title: 'Read one class', body: 'The detail lists the detection rule and the valued buys in the open snapshot.', href: '/bots' },
  ] },
  { id: 'first-wallet', title: 'First wallet analysis', steps: [
    { title: 'Open Wallet Explorer', body: 'Rows come from the open snapshot. An empty page means you have not indexed a token in this browser.', href: '/wallets', target: 'wallet-filter' },
    { title: 'Open a signer', body: 'Copy the address or follow the Etherscan link. Balance and Blockscout reads are optional and can fail.', href: '/wallets' },
  ] },
  { id: 'compare', title: 'Compare two tokens', steps: [
    { title: 'Open history', body: 'Mark two saved tokens with Compare. They align from each token’s own T0.', href: '/history', target: 'history-search' },
  ] },
  { id: 'planner', title: 'Create a launch plan', steps: [
    { title: 'Open the planner', body: 'Enter assumptions. The modeled bot buy is your input, not a forecast.', href: '/planner', target: 'planner-name' },
  ] },
  { id: 'rpc', title: 'Configure an RPC provider', steps: [
    { title: 'Open settings', body: 'One URL per line. Test the first URL, then save. Leave the list blank to use public fallbacks.', href: '/settings', target: 'rpc-list' },
  ] },
  { id: 'brand', title: 'First name and ticker review', steps: [
    { title: 'Open Brand Intelligence', body: 'A contract is optional. A future name is a proposal, not a launched token.', href: '/brand-intelligence', target: 'brand-name' },
    { title: 'Read coverage before the number', body: 'Story factors stay unscored until you write a narrative. That is not a zero, and it is not a forecast.', href: '/brand-intelligence', target: 'brand-score' },
  ] },
  { id: 'laboratory', title: 'Replay a saved launch', steps: [
    { title: 'Open Launch Laboratory', body: 'Pick a token you already indexed. Playback does not invent swaps.', href: '/laboratory' },
    { title: 'Keep simulation labeled', body: 'The reserve form is hypothetical. V3 and V4 are not run through the V2 curve.', href: '/laboratory' },
  ] },
];

const KEY = 'arc-help-tours';

export function readCompletedTours() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function markTourComplete(id: string) {
  const next = [...new Set([...readCompletedTours(), id])];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function resetTour(id: string) {
  const next = readCompletedTours().filter((item) => item !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

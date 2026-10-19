import { isAddress } from 'viem';
import type { AnalysisSuccess, Playbook } from '../types';

export type ReadinessState = 'ready' | 'needs-review' | 'blocked' | 'not-assessed';
export type ReadinessItem = { id: string; label: string; state: ReadinessState; detail: string };

export function launchReadiness(playbook: Playbook, input: { snapshot: AnalysisSuccess | null; brandCoverage: number | null; customRpc: boolean }): ReadinessItem[] {
  const nameReady = Boolean(playbook.tokenName.trim() && playbook.ticker.trim());
  const brand: ReadinessItem = !nameReady
    ? { id: 'brand', label: 'Brand', state: 'not-assessed', detail: 'Add a proposed name and ticker. No score is implied.' }
    : input.brandCoverage === null
      ? { id: 'brand', label: 'Brand', state: 'needs-review', detail: 'Name and ticker are set. Run the rubric before treating the brand as reviewed.' }
      : input.brandCoverage < 40
        ? { id: 'brand', label: 'Brand', state: 'needs-review', detail: `Editorial coverage is ${input.brandCoverage}%. The overall score stays withheld under 40%.` }
        : { id: 'brand', label: 'Brand', state: 'ready', detail: `Editorial coverage is ${input.brandCoverage}%. This is not a forecast of buyers.` };
  const address = playbook.plannedAddress.trim();
  const contract: ReadinessItem = !address
    ? { id: 'contract', label: 'Contract', state: 'not-assessed', detail: 'No contract is set. Permissions and distribution were not read.' }
    : !isAddress(address)
      ? { id: 'contract', label: 'Contract', state: 'blocked', detail: 'The planned address is not a valid 0x address.' }
      : input.snapshot && input.snapshot.kpis.buyCount > 0 && input.snapshot.kpis.sellCount > 0
        ? { id: 'contract', label: 'Contract', state: 'needs-review', detail: 'Both buys and sells were observed in the indexed window. Admin rights and taxes were not decoded, so this is not a clearance.' }
        : { id: 'contract', label: 'Contract', state: 'needs-review', detail: 'The address is stored. Buy and sell paths are not both present in an indexed snapshot. Verification metadata is not a permission audit.' };
  const liquidity: ReadinessItem = playbook.poolType !== 'v2'
    ? { id: 'liquidity', label: 'Liquidity', state: 'needs-review', detail: 'V3 and V4 concentrated liquidity are not simulated with the constant-product curve.' }
    : playbook.initialEth > 0 && Number(playbook.tokenToLp) > 0
      ? { id: 'liquidity', label: 'Liquidity', state: 'ready', detail: 'V2 reserves are set for a hypothetical impact check. The rows are not recorded trades.' }
      : { id: 'liquidity', label: 'Liquidity', state: 'not-assessed', detail: 'Enter ETH and token reserves to run the hypothetical curve.' };
  const infrastructure: ReadinessItem = input.customRpc
    ? { id: 'infrastructure', label: 'Infrastructure', state: 'ready', detail: 'A custom RPC URL is saved in this browser. It can still rate-limit.' }
    : { id: 'infrastructure', label: 'Infrastructure', state: 'needs-review', detail: 'Public fallback RPCs are in use. Wide ranges may be partial.' };
  const monitoring: ReadinessItem = { id: 'monitoring', label: 'Monitoring', state: 'needs-review', detail: 'Alerts run only while this tab is open. GitHub Pages does not run the worker, so background monitoring is not active.' };
  const research: ReadinessItem = input.snapshot
    ? { id: 'research', label: 'Post-launch research', state: 'ready', detail: 'A saved snapshot can be exported and compared. Coverage limits still apply.' }
    : { id: 'research', label: 'Post-launch research', state: 'not-assessed', detail: 'Index a token before expecting a forensic export of chain events.' };
  return [brand, contract, liquidity, infrastructure, monitoring, research];
}

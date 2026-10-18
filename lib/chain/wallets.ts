import type { Trade } from '../types';

export type WalletRow = {
  address: string;
  buyEth: number;
  sellEth: number;
  buyCount: number;
  sellCount: number;
  classification: string;
  confidence: Trade['confidence'];
  evidence: string[];
  isProject: boolean;
  assistedExecution: boolean;
  method: string;
  firstMinute: number;
  isContractSignal: boolean;
};

export function walletRows(trades: Trade[]): WalletRow[] {
  const map = new Map<string, WalletRow>();
  for (const trade of trades) {
    const key = trade.wallet.toLowerCase();
    const row = map.get(key) || {
      address: trade.wallet,
      buyEth: 0,
      sellEth: 0,
      buyCount: 0,
      sellCount: 0,
      classification: trade.classification,
      confidence: trade.confidence,
      evidence: trade.evidence,
      isProject: trade.isProject,
      assistedExecution: trade.assistedExecution,
      method: trade.method,
      firstMinute: trade.minute,
      isContractSignal: trade.evidence.some((item) => item.includes('contract code')),
    };
    if (trade.side === 'BUY') {
      row.buyCount += 1;
      row.buyEth += trade.eth || 0;
    } else {
      row.sellCount += 1;
      row.sellEth += trade.eth || 0;
    }
    if (trade.confidence === 'HIGH' || (trade.confidence === 'MEDIUM' && row.confidence !== 'HIGH')) {
      row.classification = trade.classification;
      row.confidence = trade.confidence;
      row.evidence = trade.evidence;
    }
    row.isProject = row.isProject || trade.isProject;
    row.assistedExecution = row.assistedExecution || trade.assistedExecution;
    row.firstMinute = Math.min(row.firstMinute, trade.minute);
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.buyEth - a.buyEth);
}

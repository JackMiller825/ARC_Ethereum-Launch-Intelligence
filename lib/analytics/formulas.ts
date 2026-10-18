export const KPI_HINTS = {
  grossBuy: 'Sum of valued independent buy ETH. Project-labeled wallets and swaps without a WETH hop are excluded. Wei math, then displayed in ETH.',
  botBuy: 'Sum of valued independent buys whose evidence is HIGH or MEDIUM. LOW and UNKNOWN stay out of this total. The label is not a probability.',
  grossSell: 'Sum of valued independent sell ETH. Liquidity burns and project-labeled wallets are excluded.',
  buyers: 'Count of distinct signer addresses with at least one independent buy. This is not a count of humans.',
  net: 'Valued independent buys minus valued independent sells. Gross volume can exceed this because the same ETH can turn over.',
  retention: 'Share of independent buyers who have no sell in the same window. A missing sell is not a holding commitment.',
} as const;

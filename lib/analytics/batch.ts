import { isAddress } from 'viem';

export function parseAddressList(text: string) {
  const cells = text.split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean);
  const ok: string[] = [];
  const bad: string[] = [];
  for (const cell of cells) {
    if (/^(address|ca|contract)$/i.test(cell)) continue;
    if (isAddress(cell)) ok.push(cell);
    else bad.push(cell);
  }
  return { ok: [...new Set(ok.map((item) => item.toLowerCase()))], bad };
}

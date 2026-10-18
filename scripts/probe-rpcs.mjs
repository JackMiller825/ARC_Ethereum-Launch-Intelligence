const body = {
  jsonrpc: '2.0', id: 1, method: 'eth_getLogs',
  params: [{
    address: '0x37D005660753714C6D3930cA4884B90033e232A9',
    topics: ['0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'],
    fromBlock: '0x18ebd80',
    toBlock: '0x18ebe20',
  }],
};
const urls = [
  'https://eth.llamarpc.com',
  'https://rpc.ankr.com/eth',
  'https://1rpc.io/eth',
  'https://eth.drpc.org',
  'https://cloudflare-eth.com',
  'https://rpc.mevblocker.io',
  'https://eth.merkle.io',
  'https://mainnet.gateway.tenderly.co',
  'https://ethereum.blockpi.network/v1/rpc/public',
  'https://endpoints.omniatech.io/v1/eth/mainnet/public',
  'https://eth-mainnet.public.blastapi.io',
  'https://rpc.flashbots.net',
  'https://eth.api.onfinality.io/public',
  'https://0xrpc.io/eth',
  'https://rpc.eth.gateway.fm',
  'https://ethereum-jsonrpc.publicnode.com',
  'https://api.zan.top/node/v1/eth/mainnet/public',
];
for (const url of urls) {
  const t = Date.now();
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(12000) });
    const j = await r.json();
    const n = Array.isArray(j.result) ? j.result.length : null;
    console.log(r.status, `${Date.now() - t}ms`, n === null ? JSON.stringify(j.error || j).slice(0, 160) : `logs ${n}`, url);
  } catch (e) {
    console.log('ERR', `${Date.now() - t}ms`, e instanceof Error ? e.message.slice(0, 120) : e, url);
  }
}

try {
  const u = 'https://eth.blockscout.com/api?module=logs&action=getLogs&fromBlock=26131840&toBlock=26132000&address=0x37D005660753714C6D3930cA4884B90033e232A9&topic0=0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822';
  const r = await fetch(u, { signal: AbortSignal.timeout(20000) });
  const j = await r.json();
  console.log('blockscout logs', j.status, j.message, Array.isArray(j.result) ? j.result.length : JSON.stringify(j).slice(0, 300));
} catch (e) {
  console.log('blockscout err', e instanceof Error ? e.message : e);
}

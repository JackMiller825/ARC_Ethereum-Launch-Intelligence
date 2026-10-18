const urls = [
  'https://rpc.mevblocker.io',
  'https://mainnet.gateway.tenderly.co',
  'https://0xrpc.io/eth',
  'https://eth.drpc.org',
  'https://ethereum.publicnode.com',
  'https://eth.blockscout.com/api',
];
const body = { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] };
for (const url of urls) {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://jackmiller825.github.io' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
    console.log(r.status, r.headers.get('access-control-allow-origin'), url);
  } catch (e) {
    console.log('ERR', e instanceof Error ? e.message.slice(0, 100) : e, url);
  }
}

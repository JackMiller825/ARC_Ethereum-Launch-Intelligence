import { createPublicClient, http, parseAbi, getAddress } from 'viem';
import { mainnet } from 'viem/chains';

if (!process.env.INDEX_TOKEN) {
  console.error('Set INDEX_TOKEN to the ERC-20 you want to probe.');
  process.exit(1);
}
const token = getAddress(process.env.INDEX_TOKEN);
const WETH = getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
const USDC = getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
const V2 = getAddress('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f');
const V3 = getAddress('0x1F98431c8aD98523631AE4a59f267346ea31F984');
const SUSHI = getAddress('0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac');
const urls = [
  'https://ethereum.publicnode.com',
  'https://eth.llamarpc.com',
  'https://rpc.ankr.com/eth',
  'https://1rpc.io/eth',
];

const v2abi = parseAbi(['function getPair(address,address) view returns (address)']);
const v3abi = parseAbi(['function getPool(address,address,uint24) view returns (address)']);
const erc20 = parseAbi(['function name() view returns (string)', 'function symbol() view returns (string)', 'function decimals() view returns (uint8)']);

for (const url of urls) {
  const client = createPublicClient({ chain: mainnet, transport: http(url, { timeout: 15000 }) });
  try {
    const head = await client.getBlockNumber();
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({ address: token, abi: erc20, functionName: 'name' }),
      client.readContract({ address: token, abi: erc20, functionName: 'symbol' }),
      client.readContract({ address: token, abi: erc20, functionName: 'decimals' }),
    ]);
    const pairs = {};
    for (const [label, factory, quote] of [['uni-weth', V2, WETH], ['uni-usdc', V2, USDC], ['sushi-weth', SUSHI, WETH]]) {
      pairs[label] = await client.readContract({ address: factory, abi: v2abi, functionName: 'getPair', args: [token, quote] });
    }
    const fees = [100, 500, 3000, 10000];
    const v3 = {};
    for (const fee of fees) {
      v3[fee] = await client.readContract({ address: V3, abi: v3abi, functionName: 'getPool', args: [token, WETH, fee] });
    }
    console.log(JSON.stringify({ url, head: head.toString(), name, symbol, decimals, pairs, v3 }, null, 2));
    break;
  } catch (e) {
    console.log('FAIL', url, e instanceof Error ? e.message.slice(0, 180) : e);
  }
}

const tx = await fetch('https://eth.blockscout.com/api/v2/transactions/0x6392e3ef7debb516c406b738b3bff75cbb48ab11de679d0b31824fabf57a5b5c').then(r => r.json());
console.log('creation block', tx.block_number, tx.timestamp, tx.status);

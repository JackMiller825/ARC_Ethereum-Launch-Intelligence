import { createPublicClient, http, parseAbiItem, getAddress, decodeEventLog, formatEther } from 'viem';
import { mainnet } from 'viem/chains';
import { writeFileSync } from 'fs';

const pairAddress = process.env.PAIR_ADDRESS || '';
const token = process.env.INDEX_TOKEN ? getAddress(process.env.INDEX_TOKEN) : '';
if (!token || !pairAddress) {
  console.error('Set INDEX_TOKEN and PAIR_ADDRESS to capture a swap. This script does not pick a token.');
  process.exit(1);
}
const pair = getAddress(pairAddress);
const client = createPublicClient({ chain: mainnet, transport: http('https://rpc.mevblocker.io', { timeout: 30000 }) });
const swapEvent = parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)');
const mintEvent = parseAbiItem('event Mint(address indexed sender, uint256 amount0, uint256 amount1)');
const pairAbi = [
  parseAbiItem('function token0() view returns (address)'),
  parseAbiItem('function token1() view returns (address)'),
  parseAbiItem('function getReserves() view returns (uint112,uint112,uint32)'),
];

const token0 = await client.readContract({ address: pair, abi: pairAbi, functionName: 'token0' });
const token1 = await client.readContract({ address: pair, abi: pairAbi, functionName: 'token1' });
const reserves = await client.readContract({ address: pair, abi: pairAbi, functionName: 'getReserves' });
console.log({ token0, token1, reserves: reserves.map(x => x.toString()) });

const from = 26131840n;
const to = from + 800n;
const swaps = await client.getLogs({ address: pair, event: swapEvent, fromBlock: from, toBlock: to });
const mints = await client.getLogs({ address: pair, event: mintEvent, fromBlock: from, toBlock: to });
console.log('swaps', swaps.length, 'mints', mints.length);
if (mints[0]) console.log('first mint', mints[0].blockNumber.toString(), mints[0].transactionHash, mints[0].args);
if (swaps[0]) {
  const s = swaps[0];
  console.log('first swap', s.blockNumber.toString(), s.transactionHash, s.logIndex, s.args);
  const tx = await client.getTransaction({ hash: s.transactionHash });
  const block = await client.getBlock({ blockNumber: s.blockNumber });
  const fixture = {
    note: 'Captured swap log for replay tests. Not synthetic.',
    pair,
    token,
    token0,
    token1,
    blockNumber: Number(s.blockNumber),
    blockHash: s.blockHash,
    timestamp: Number(block.timestamp),
    txHash: s.transactionHash,
    txIndex: s.transactionIndex,
    logIndex: s.logIndex,
    from: tx.from,
    to: tx.to,
    topics: s.topics,
    data: s.data,
    args: {
      sender: s.args.sender,
      amount0In: s.args.amount0In.toString(),
      amount1In: s.args.amount1In.toString(),
      amount0Out: s.args.amount0Out.toString(),
      amount1Out: s.args.amount1Out.toString(),
      to: s.args.to,
    },
  };
  writeFileSync('tests/fixtures/sish-v2-swap.json', JSON.stringify(fixture, null, 2));
  console.log('wrote fixture', formatEther(s.args.amount0In || s.args.amount1In));
}
console.log('last swap block in sample', swaps.at(-1)?.blockNumber?.toString(), 'count', swaps.length);

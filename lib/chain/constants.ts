import { encodeEventTopics, parseAbiItem, type AbiEvent } from 'viem';

export const CHAIN_ID = 1;
export const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
export const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
export const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
export const QUOTES = [WETH, USDC, USDT, DAI];
export const ZERO = '0x0000000000000000000000000000000000000000';

export const V2_FACTORIES = [
  { name: 'Uniswap V2', address: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f' },
  { name: 'SushiSwap', address: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac' },
];
export const V3_FACTORY = { name: 'Uniswap V3', address: '0x1F98431c8aD98523631AE4a59f267346ea31F984' };
export const V3_FEES = [100, 500, 3000, 10000];
export const V4_POOL_MANAGER = '0x000000000004444c5dc75cB358380D2e3dE08A90';

export const DEFAULT_RPCS = [
  'https://rpc.mevblocker.io',
  'https://mainnet.gateway.tenderly.co',
  'https://0xrpc.io/eth',
  'https://eth.drpc.org',
  'https://ethereum.publicnode.com',
];

export const HEURISTIC_VERSION = 'arc-heuristic-v1';

export const ROUTERS: Record<string, string> = {
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2 Router',
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': 'Uniswap SwapRouter02',
  '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad': 'Uniswap Universal Router',
  '0x66a9893cc07d91d95644aedd05d03f95e1dba8af': 'Uniswap Universal Router',
  '0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b': 'Uniswap Universal Router',
  '0x1111111254eeb25477b68fb85ed929f73a960582': '1inch Router',
  '0x111111125421ca6dc452d289314280a0f8842a65': '1inch Router',
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': '0x Settler',
};

export const swapV2 = parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)');
export const mintV2 = parseAbiItem('event Mint(address indexed sender, uint256 amount0, uint256 amount1)');
export const burnV2 = parseAbiItem('event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)');
export const swapV3 = parseAbiItem('event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)');
export const mintV3 = parseAbiItem('event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)');
export const burnV3 = parseAbiItem('event Burn(address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)');
export const swapV4 = parseAbiItem('event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)');
export const initV4 = parseAbiItem('event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)');
export const modifyV4 = parseAbiItem('event ModifyLiquidity(bytes32 indexed id, address indexed sender, int24 tickLower, int24 tickUpper, int256 liquidityDelta, bytes32 salt)');

function topic(event: AbiEvent) {
  return encodeEventTopics({ abi: [event], eventName: event.name })[0];
}

export const TOPIC = {
  swapV2: topic(swapV2),
  mintV2: topic(mintV2),
  burnV2: topic(burnV2),
  swapV3: topic(swapV3),
  mintV3: topic(mintV3),
  burnV3: topic(burnV3),
  swapV4: topic(swapV4),
  initV4: topic(initV4),
  modifyV4: topic(modifyV4),
};

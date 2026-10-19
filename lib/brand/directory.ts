export type DirectoryEntry = {
  name: string;
  ticker: string;
  chain: string;
  address?: string;
  source: 'bundled-reference';
  url?: string;
  aliases?: string[];
};

/** A short public reference list. It is not a complete token registry and not a trademark database. */
export const BUNDLED_DIRECTORY: DirectoryEntry[] = [
  { name: 'Pepe', ticker: 'PEPE', chain: 'ethereum', address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', source: 'bundled-reference', url: 'https://etherscan.io/token/0x6982508145454Ce325dDbE47a25d4ec3d2311933', aliases: ['pepe the frog'] },
  { name: 'Shiba Inu', ticker: 'SHIB', chain: 'ethereum', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', source: 'bundled-reference', url: 'https://etherscan.io/token/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE' },
  { name: 'Dogecoin', ticker: 'DOGE', chain: 'dogecoin', source: 'bundled-reference', url: 'https://dogecoin.com/', aliases: ['doge'] },
  { name: 'Wrapped Ether', ticker: 'WETH', chain: 'ethereum', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', source: 'bundled-reference', url: 'https://etherscan.io/token/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
  { name: 'Tether USD', ticker: 'USDT', chain: 'ethereum', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', source: 'bundled-reference', url: 'https://etherscan.io/token/0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { name: 'USD Coin', ticker: 'USDC', chain: 'ethereum', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', source: 'bundled-reference', url: 'https://etherscan.io/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { name: 'Uniswap', ticker: 'UNI', chain: 'ethereum', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', source: 'bundled-reference', url: 'https://etherscan.io/token/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
  { name: 'Chainlink', ticker: 'LINK', chain: 'ethereum', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', source: 'bundled-reference', url: 'https://etherscan.io/token/0x514910771AF9Ca656af840dff83E8264EcF986CA' },
  { name: 'Dai', ticker: 'DAI', chain: 'ethereum', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', source: 'bundled-reference', url: 'https://etherscan.io/token/0x6B175474E89094C44Da98b954EedeAC495271d0F' },
  { name: 'Aave', ticker: 'AAVE', chain: 'ethereum', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', source: 'bundled-reference', url: 'https://etherscan.io/token/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9' },
];

export const MAJOR_TICKERS = new Set(['ETH', 'BTC', 'SOL', 'BNB', 'USDT', 'USDC', 'DOGE', 'SHIB', 'PEPE', 'WETH', 'UNI', 'LINK', 'DAI']);
export const MEME_ROOTS = ['pepe', 'doge', 'shib', 'shiba', 'wojak', 'chad', 'bonk', 'mog', 'floki', 'inu', 'frog'];
export const GENERIC_WORDS = ['coin', 'token', 'moon', 'inu', 'ai', 'gpt', 'elon', 'doge', 'pepe', 'baby'];
export const SCREENED_BRANDS = ['apple', 'google', 'nike', 'disney', 'tesla', 'microsoft', 'amazon', 'mcdonald'];
export const OFFICIAL_WORDS = ['official', 'binance', 'coinbase', 'uniswap', 'ethereum foundation', 'vitalik'];
export const SCAM_PHRASES = ['guaranteed profit', 'elon giveaway', 'airdrop now'];
export const PERSON_CUES = ['elon', 'trump', 'vitalik'];
export const COLOR_WORDS = ['red', 'blue', 'gold', 'green', 'black', 'pink', 'purple'];
export const ANIMAL_WORDS = ['frog', 'dog', 'cat', 'bird', 'fish', 'ape', 'penguin', 'finch', 'pebble'];
export const COMMON_WORDS = ['apple', 'link', 'rock', 'baby', 'moon', 'safe', 'gold', 'king', 'baby'];
export const TICKER_WORDS = ['frog', 'moon', 'gold', 'king', 'pepe', 'doge', 'cat', 'bird', 'fish', 'rock', 'safe'];

# Collision research

## Scope that actually runs

1. A bundled reference list in `lib/brand/directory.ts`: Pepe, Shiba Inu, Dogecoin (no Ethereum address), WETH, USDT, USDC, Uniswap, Chainlink, Dai, and Aave. This is not a complete registry.
2. DexScreener search, from the browser, exact name or exact ticker only.
3. CoinGecko search, from the browser, exact name or exact ticker only.

Match methods on the bundled list: exact name, exact ticker, normalized punctuation, word order, abbreviation, alias, spelling at similarity 0.84 or higher, soundex when the spelling is not already that close, and a shared meme root. A short lookalike such as Pepper versus Pepe stays below the spelling cutoff.

## Scope that does not run

Domain registration, a trademark database, and general web search have no configured API. Their status is unavailable. A screened list of a few company names can raise a preliminary flag. That is not a filing search and not legal advice.

An empty result is not a statement that the name is unused. Duplicate tickers are common and are stored as confusion warnings, not accusations.

Live responses are cached in memory for six hours. A failed request does not get turned into a uniqueness score. Cancelling the in-flight request leaves the bundled-list score in place.

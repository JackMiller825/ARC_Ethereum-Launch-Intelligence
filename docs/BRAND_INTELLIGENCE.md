# Brand intelligence

Name and ticker scoring uses rubric `arc-brand-v1`: 10 categories and 100 criteria. Weights rescale to 100. Missing input is insufficient or unknown, not zero. The overall score is withheld under 40% coverage.

Modes:

- Existing token: paste a contract. Name and ticker come from the contract read. A failed read does not substitute another token.
- Future token: name and ticker only. No contract is required.
- Compare: 2 to 20 lines of `Name | Ticker`.
- Improve: 5, 10, or 20 alternatives scored with the same rubric. The original stays until you choose one.

Collision research uses the bundled reference list and, when they respond, DexScreener and CoinGecko. Uniqueness is not claimed when those sources are silent.

The five-second check shows the name and ticker in the form, hides them, and stores the responses you type. The rate is matches divided by saved responses. An empty list has no rate. It is not a crowd study.

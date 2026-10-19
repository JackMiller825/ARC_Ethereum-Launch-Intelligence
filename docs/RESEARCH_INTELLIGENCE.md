# Research intelligence

The forensic summary is built from one stored `AnalysisSuccess`. It states what was reconstructed, the T0 clock, signer counts, gross buy, gross sell, net flow, the automated share, liquidity events, and the warnings already on the snapshot.

Each notable event keeps its transaction hash when the snapshot has one. The research-completeness score is the mean of block coverage, pool presence, reconciliation, valuation completeness, and a capped finality term. The page says it is not a safety rating.

The assistant answers only when the open snapshot or brand record contains the fact. Otherwise it says the question was not determined. It does not invent an address or a number. On the published site it does not call a model. `POST /api/research` returns 501 when `RESEARCH_MODEL_URL` and `RESEARCH_MODEL_KEY` are absent, and it still refuses to forward chain facts when those variables exist.

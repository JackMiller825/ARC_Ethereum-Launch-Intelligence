# Brand intelligence architecture

Rubric version `arc-brand-v1`. One scoring function, `analyzeBrand` in `lib/brand/score.ts`, serves the brand page, the Token Analyzer brand tab, the Launch Planner, and candidate comparison. Pages do not keep separate formulas.

## Records

A `BrandAnalysis` stores the original input, the normalized name and ticker, an optional contract, the profile, the 100 factor rows, category scores, coverage, collision rows, research source status, and the rubric version. Future and historical names use a stable candidate id that does not require an address. Existing tokens use `ca:` plus the address. A later link to a deployed contract copies the earlier score and says trading results were not applied.

Browser persistence is IndexedDB stores `brandAnalyses` and `brandComparisons` (database version 3). GitHub Pages does not run the worker, so there is no server copy of these records.

## What is not wired

No language model is called. `applyModelNotes` can attach a note to an editorial factor and is rejected for deterministic factors and for directory evidence. No domain API, trademark database, or web-search API is configured. Those sources stay unavailable. DexScreener and CoinGecko are requested from the browser and recorded as unavailable when they fail. A mascot is text. No image is graded.

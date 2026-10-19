# Launch readiness

The planner shows six operational states: brand, contract, liquidity, infrastructure, monitoring, and post-launch research. Each is ready, needs review, blocked, or not assessed.

- Brand is not assessed until a name and ticker are typed. Coverage under 40% stays needs review because the overall score is withheld.
- Contract is blocked when the planned address is not a valid 0x string. Observed buys and sells do not become a permission audit. Admin rights and taxes are not decoded.
- Liquidity is ready for a hypothetical V2 check only when both reserves are set. V3 and V4 stay needs review.
- Infrastructure is ready when a custom RPC URL is saved, and needs review on the public fallbacks.
- Monitoring stays needs review. Alerts run in the open tab. GitHub Pages does not run the worker.
- Post-launch research is ready when a snapshot exists to export.

None of these states predict buyers or price.

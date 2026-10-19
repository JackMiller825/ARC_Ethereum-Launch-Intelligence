# UI and UX refinement

`components/premium-pagination.tsx` renders “Showing 21–40 of 247 results”, a rows-per-page select, Previous, compact page numbers, and Next. Zero rows render nothing.

The analyzer ledger, the history library, the brand comparison, and the replay feed use that footer.

Replay and recognition panels use the existing panel, button, and table styles. A cutoff grid uses the same surface as metric tiles. Marker rows include a text label as well as a color dot.

Clearing local history now asks for confirmation. Recognition responses and notes stay.

What was not restyled in this pass: planner wizard steps, bot strategy cards, and wallet timelines. Their existing layouts remain.

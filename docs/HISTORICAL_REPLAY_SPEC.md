# Historical replay

Route `/laboratory`. Playback uses swaps already stored for a token the user indexed.

Ordering is block number, transaction index, then log index. The cursor is a prefix of that list. Play, pause, reset, step trade, step block, step minute, seek by UTC timestamp, and jump to the next notable marker all move that cursor. Speeds are 0.25×, 0.5×, 1×, 2×, 5×, 10×, and 30×. Speed changes the delay between cursor steps. Timestamps on the trades stay as stored.

Purchases, sales, and a single stored pool can be filtered. Hiding a category omits those rows from the playback list. It does not delete them from the snapshot.

The cutoff shows cumulative valued buys, sells, net wei, signer count, evidence-class counts, and the visible feed. An implied price is taken from the last valued swap inside the cutoff and labeled as that swap. Pool reserve history is not on the snapshot, so it is not drawn.

Markers name first swap, purchase, sale, large purchase, large sale, liquidity add or removal from stored audit events, a heuristic cluster of three or more high or medium rows in one block, and a gap when coverage is provisional. A gap does not insert trades.

Excluding transaction hashes is a local filter. The page does not watch a later chain reorganization.

Clicking a signer lists that signer’s stored rows inside the cutoff. Exports are the visible timeline CSV, a JSON summary of the cutoff, and the browser print dialog. Forensic HTML remains separate from the hypothetical V2 simulation.

Bookmarks store a cursor in the page session. They are not chain data.

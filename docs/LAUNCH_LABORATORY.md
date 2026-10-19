# Launch Laboratory

Route `/laboratory`.

Replay chooses a snapshot already saved in this browser. Play, pause, step one block, step one minute, speed, and reset walk that stored list in block order. No row is synthesized. Minutes without a valued swap are omitted. A comparison cell shows a dash when the other token has no valued swap in that minute. That dash is not a measured zero. Provisional coverage is labeled on the page.

The simulation asks for ETH reserves, token reserves, and a buy size. It uses the Uniswap V2 constant-product formula with a 30 basis-point fee. The fee stays in the input reserve. The result is labeled hypothetical. V3 and V4 concentrated liquidity are not run through that curve.

A second saved token can be placed on the same minute index. The page says the alignment is not evidence that one launch caused the other.

JSON and HTML exports include the generation time and the hypothetical label on simulations.

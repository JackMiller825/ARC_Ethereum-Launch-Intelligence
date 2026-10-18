CREATE INDEX IF NOT EXISTS economic_trades_token_block_idx ON economic_trades (chain_id, token_address, block_number);
CREATE INDEX IF NOT EXISTS raw_logs_block_idx ON raw_logs (chain_id, block_number);
CREATE INDEX IF NOT EXISTS pools_token0_idx ON pools (chain_id, token0);
CREATE INDEX IF NOT EXISTS pools_token1_idx ON pools (chain_id, token1);

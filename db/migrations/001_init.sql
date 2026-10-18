CREATE TABLE IF NOT EXISTS launches (
  chain_id integer NOT NULL,
  token_address text NOT NULL,
  t0_block bigint,
  t0_tx text,
  t0_log_index integer,
  t0_timestamp timestamptz,
  status text NOT NULL DEFAULT 'provisional',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, token_address)
);

CREATE TABLE IF NOT EXISTS contracts (
  chain_id integer NOT NULL,
  address text NOT NULL,
  deployer text,
  deploy_block bigint,
  deploy_tx text,
  PRIMARY KEY (chain_id, address)
);

CREATE TABLE IF NOT EXISTS token_metadata (
  chain_id integer NOT NULL,
  address text NOT NULL,
  name text,
  symbol text,
  decimals integer,
  holders integer,
  verified boolean,
  source text NOT NULL,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, address)
);

CREATE TABLE IF NOT EXISTS pools (
  chain_id integer NOT NULL,
  protocol text NOT NULL,
  pool_address text NOT NULL,
  pool_id text NOT NULL DEFAULT '',
  token0 text NOT NULL,
  token1 text NOT NULL,
  quote text,
  fee integer,
  discovery text NOT NULL,
  PRIMARY KEY (chain_id, protocol, pool_address, pool_id)
);

CREATE TABLE IF NOT EXISTS raw_blocks (
  chain_id integer NOT NULL,
  block_number bigint NOT NULL,
  block_hash text NOT NULL,
  block_timestamp timestamptz,
  status text NOT NULL,
  PRIMARY KEY (chain_id, block_number)
);

CREATE TABLE IF NOT EXISTS raw_logs (
  chain_id integer NOT NULL,
  tx_hash text NOT NULL,
  log_index integer NOT NULL,
  block_number bigint NOT NULL,
  block_hash text NOT NULL,
  address text NOT NULL,
  topics jsonb NOT NULL,
  data text NOT NULL,
  source text NOT NULL,
  PRIMARY KEY (chain_id, tx_hash, log_index)
);

CREATE TABLE IF NOT EXISTS decoded_swaps (
  chain_id integer NOT NULL,
  tx_hash text NOT NULL,
  log_index integer NOT NULL,
  protocol text NOT NULL,
  pool text NOT NULL,
  pool_id text,
  amount0 numeric NOT NULL,
  amount1 numeric NOT NULL,
  PRIMARY KEY (chain_id, tx_hash, log_index)
);

CREATE TABLE IF NOT EXISTS economic_trades (
  chain_id integer NOT NULL,
  trade_id text NOT NULL,
  token_address text NOT NULL,
  tx_hash text NOT NULL,
  block_number bigint NOT NULL,
  log_index integer NOT NULL,
  signer text,
  recipient text,
  side text NOT NULL,
  eth_wei numeric,
  valuation text NOT NULL,
  classification text NOT NULL,
  confidence text NOT NULL,
  is_project boolean NOT NULL DEFAULT false,
  evidence jsonb NOT NULL,
  heuristic_version text NOT NULL,
  PRIMARY KEY (chain_id, trade_id)
);

CREATE TABLE IF NOT EXISTS trading_actors (
  chain_id integer NOT NULL,
  token_address text NOT NULL,
  signer text NOT NULL,
  is_contract boolean,
  classification text,
  confidence text,
  PRIMARY KEY (chain_id, token_address, signer)
);

CREATE TABLE IF NOT EXISTS wallet_features (
  chain_id integer NOT NULL,
  token_address text NOT NULL,
  wallet text NOT NULL,
  features jsonb NOT NULL,
  PRIMARY KEY (chain_id, token_address, wallet)
);

CREATE TABLE IF NOT EXISTS actor_labels (
  chain_id integer NOT NULL,
  address text NOT NULL,
  role text NOT NULL,
  reason text NOT NULL,
  source text NOT NULL,
  PRIMARY KEY (chain_id, address, role)
);

CREATE TABLE IF NOT EXISTS launch_windows (
  chain_id integer NOT NULL,
  token_address text NOT NULL,
  mode text NOT NULL,
  minutes integer NOT NULL,
  start_ts timestamptz,
  end_ts timestamptz,
  PRIMARY KEY (chain_id, token_address, mode, minutes)
);

CREATE TABLE IF NOT EXISTS minute_kpis (
  chain_id integer NOT NULL,
  token_address text NOT NULL,
  minute_offset integer NOT NULL,
  gross_buy_wei numeric NOT NULL,
  gross_sell_wei numeric NOT NULL,
  PRIMARY KEY (chain_id, token_address, minute_offset)
);

CREATE TABLE IF NOT EXISTS annotation_events (
  chain_id integer NOT NULL,
  token_address text NOT NULL,
  tx_hash text NOT NULL,
  log_index integer NOT NULL,
  kind text NOT NULL,
  reason text NOT NULL,
  PRIMARY KEY (chain_id, token_address, tx_hash, log_index, kind)
);

CREATE TABLE IF NOT EXISTS ingestion_offsets (
  chain_id integer NOT NULL,
  stream_key text NOT NULL,
  block_number bigint NOT NULL,
  block_hash text NOT NULL,
  status text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, stream_key)
);

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
import type { AnalysisSuccess } from '../types';
import { reorgStatus } from '../chain/reorg';

export async function migrate(pool: pg.Pool) {
  const sql = readFileSync(join(process.cwd(), 'db/migrations/001_init.sql'), 'utf8');
  await pool.query(sql);
}

export async function persistAnalysis(pool: pg.Pool, analysis: AnalysisSuccess) {
  const chainId = 1;
  const token = analysis.token.address.toLowerCase();
  const existing = await pool.query('SELECT block_number, block_hash FROM ingestion_offsets WHERE chain_id = $1 AND stream_key = $2', [chainId, token]);
  const stored = existing.rows[0] ? { chainId, blockNumber: Number(existing.rows[0].block_number), blockHash: String(existing.rows[0].block_hash) } : null;
  if (stored && stored.blockNumber === analysis.coverage.toBlock) {
    const status = reorgStatus(stored, analysis.coverage.tipHash);
    if (status.status === 'reorg' && status.rollbackTo !== null) {
      await pool.query('DELETE FROM economic_trades WHERE chain_id = $1 AND token_address = $2 AND block_number >= $3', [chainId, token, status.rollbackTo]);
      await pool.query('DELETE FROM raw_logs WHERE chain_id = $1 AND block_number >= $2', [chainId, status.rollbackTo]);
      await pool.query('DELETE FROM minute_kpis WHERE chain_id = $1 AND token_address = $2', [chainId, token]);
    }
  }
  await pool.query(
    `INSERT INTO token_metadata (chain_id, address, name, symbol, decimals, holders, verified, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (chain_id, address) DO UPDATE SET name = EXCLUDED.name, symbol = EXCLUDED.symbol, decimals = EXCLUDED.decimals, holders = EXCLUDED.holders, verified = EXCLUDED.verified, source = EXCLUDED.source, refreshed_at = now()`,
    [chainId, token, analysis.token.name, analysis.token.symbol, analysis.token.decimals, analysis.token.holders, Boolean(analysis.token.verified), analysis.token.source],
  );
  await pool.query(
    `INSERT INTO contracts (chain_id, address, deployer) VALUES ($1,$2,$3)
     ON CONFLICT (chain_id, address) DO UPDATE SET deployer = EXCLUDED.deployer`,
    [chainId, token, analysis.token.deployer || null],
  );
  await pool.query(
    `INSERT INTO launches (chain_id, token_address, t0_block, t0_tx, t0_log_index, t0_timestamp, status)
     VALUES ($1,$2,$3,$4,$5, CASE WHEN $6::bigint IS NULL THEN NULL ELSE to_timestamp($6::bigint) END, $7)
     ON CONFLICT (chain_id, token_address) DO UPDATE SET t0_block = EXCLUDED.t0_block, t0_tx = EXCLUDED.t0_tx, t0_log_index = EXCLUDED.t0_log_index, t0_timestamp = EXCLUDED.t0_timestamp, status = EXCLUDED.status, updated_at = now()`,
    [chainId, token, analysis.timeline.t0Block, analysis.timeline.t0Tx, analysis.timeline.t0LogIndex, analysis.timeline.t0Timestamp, analysis.token.status],
  );
  for (const poolInfo of analysis.pools) {
    await pool.query(
      `INSERT INTO pools (chain_id, protocol, pool_address, pool_id, token0, token1, quote, fee, discovery)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (chain_id, protocol, pool_address, pool_id) DO UPDATE SET discovery = EXCLUDED.discovery`,
      [chainId, poolInfo.protocol, poolInfo.address.toLowerCase(), poolInfo.poolId || '', poolInfo.token0.toLowerCase(), poolInfo.token1.toLowerCase(), poolInfo.quote.toLowerCase(), poolInfo.fee || null, poolInfo.discovery],
    );
  }
  for (const trade of analysis.trades) {
    await pool.query(
      `INSERT INTO economic_trades (chain_id, trade_id, token_address, tx_hash, block_number, log_index, signer, recipient, side, eth_wei, valuation, classification, confidence, is_project, evidence, heuristic_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16)
       ON CONFLICT (chain_id, trade_id) DO UPDATE SET classification = EXCLUDED.classification, confidence = EXCLUDED.confidence, eth_wei = EXCLUDED.eth_wei, is_project = EXCLUDED.is_project, evidence = EXCLUDED.evidence`,
      [chainId, trade.id, token, trade.txHash, trade.blockNumber, trade.logIndex, trade.wallet, trade.recipient, trade.side, trade.ethWei, trade.valuation, trade.classification, trade.confidence, trade.isProject, JSON.stringify(trade.evidence), analysis.coverage.heuristicVersion],
    );
  }
  for (const event of analysis.audit) {
    await pool.query(
      `INSERT INTO annotation_events (chain_id, token_address, tx_hash, log_index, kind, reason)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (chain_id, token_address, tx_hash, log_index, kind) DO UPDATE SET reason = EXCLUDED.reason`,
      [chainId, token, event.txHash, event.logIndex, event.kind, event.reason],
    );
  }
  await pool.query(
    `INSERT INTO ingestion_offsets (chain_id, stream_key, block_number, block_hash, status)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (chain_id, stream_key) DO UPDATE SET block_number = EXCLUDED.block_number, block_hash = EXCLUDED.block_hash, status = EXCLUDED.status, updated_at = now()`,
    [chainId, token, analysis.coverage.toBlock, analysis.coverage.tipHash, analysis.token.status],
  );
}

export async function openPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');
  return new pg.Pool({ connectionString: process.env.DATABASE_URL });
}

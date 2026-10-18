import { bigint, boolean, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

export const economicTrades = pgTable('economic_trades', {
  chainId: integer('chain_id').notNull(),
  tradeId: text('trade_id').notNull(),
  tokenAddress: text('token_address').notNull(),
  txHash: text('tx_hash').notNull(),
  blockNumber: bigint('block_number', { mode: 'number' }).notNull(),
  logIndex: integer('log_index').notNull(),
  signer: text('signer'),
  recipient: text('recipient'),
  side: text('side').notNull(),
  ethWei: numeric('eth_wei'),
  valuation: text('valuation').notNull(),
  classification: text('classification').notNull(),
  confidence: text('confidence').notNull(),
  isProject: boolean('is_project').notNull().default(false),
  evidence: jsonb('evidence').notNull(),
  heuristicVersion: text('heuristic_version').notNull(),
}, (table) => [primaryKey({ columns: [table.chainId, table.tradeId] })]);

export const ingestionOffsets = pgTable('ingestion_offsets', {
  chainId: integer('chain_id').notNull(),
  streamKey: text('stream_key').notNull(),
  blockNumber: bigint('block_number', { mode: 'number' }).notNull(),
  blockHash: text('block_hash').notNull(),
  status: text('status').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.chainId, table.streamKey] })]);

export const rawLogs = pgTable('raw_logs', {
  chainId: integer('chain_id').notNull(),
  txHash: text('tx_hash').notNull(),
  logIndex: integer('log_index').notNull(),
  blockNumber: bigint('block_number', { mode: 'number' }).notNull(),
  blockHash: text('block_hash').notNull(),
  address: text('address').notNull(),
  topics: jsonb('topics').notNull(),
  data: text('data').notNull(),
  source: text('source').notNull(),
}, (table) => [primaryKey({ columns: [table.chainId, table.txHash, table.logIndex] })]);

/**
 * The phone's schema is the same shape as the server's will be, so the sync
 * engine at M4 has nothing to translate. `sync_outbox` is here from day one and
 * stays empty until then — adding it later would mean a migration on live data.
 */
export const SCHEMA_VERSION = 1;

export const MIGRATIONS: readonly string[] = [
  `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS occasion (
    id         TEXT PRIMARY KEY NOT NULL,
    label      TEXT NOT NULL,
    is_preset  INTEGER NOT NULL DEFAULT 0,
    use_count  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS counterparty (
    id          TEXT PRIMARY KEY NOT NULL,
    local_name  TEXT NOT NULL,
    phone_e164  TEXT,
    archived_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS ledger (
    id               TEXT PRIMARY KEY NOT NULL,
    counterparty_id  TEXT NOT NULL REFERENCES counterparty(id) ON DELETE CASCADE,
    currency         TEXT NOT NULL,
    last_activity_at INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS ledger_counterparty ON ledger(counterparty_id);

  CREATE TABLE IF NOT EXISTS entry (
    id                 TEXT PRIMARY KEY NOT NULL,
    ledger_id          TEXT NOT NULL REFERENCES ledger(id) ON DELETE CASCADE,
    direction          TEXT NOT NULL CHECK (direction IN ('lent', 'borrowed')),
    amount_minor       INTEGER NOT NULL CHECK (amount_minor >= 0),
    occasion_id        TEXT REFERENCES occasion(id) ON DELETE SET NULL,
    note               TEXT,
    occurred_at        INTEGER NOT NULL,
    recorded_at        INTEGER NOT NULL,
    status             TEXT NOT NULL DEFAULT 'self_recorded',
    settles_entry_id   TEXT REFERENCES entry(id) ON DELETE SET NULL,
    reverses_entry_id  TEXT REFERENCES entry(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS entry_ledger ON entry(ledger_id, occurred_at DESC);
  CREATE INDEX IF NOT EXISTS entry_settles ON entry(settles_entry_id);
  CREATE INDEX IF NOT EXISTS entry_recorded ON entry(recorded_at DESC);

  CREATE TABLE IF NOT EXISTS sync_outbox (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    op         TEXT NOT NULL,
    table_name TEXT NOT NULL,
    row_id     TEXT NOT NULL,
    payload    TEXT NOT NULL,
    attempts   INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  `,
];

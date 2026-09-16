import * as SQLite from 'expo-sqlite';
import { PRESET_OCCASIONS } from '../domain/occasions';
import { MIGRATIONS } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('aeris.db');
  await migrate(db);
  return db;
}

async function migrate(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version += 1) {
    const sql = MIGRATIONS[version];
    if (!sql) continue;
    await database.execAsync(sql);
    await database.execAsync(`PRAGMA user_version = ${version + 1}`);
  }

  if (current === 0) await seedOccasions(database);
}

async function seedOccasions(database: SQLite.SQLiteDatabase): Promise<void> {
  for (const occasion of PRESET_OCCASIONS) {
    await database.runAsync(
      'INSERT OR IGNORE INTO occasion (id, label, is_preset, use_count) VALUES (?, ?, 1, 0)',
      occasion.id,
      occasion.label,
    );
  }
}

/** Only used by tests and "delete everything" in settings. */
export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM entry;
    DELETE FROM ledger;
    DELETE FROM counterparty;
    DELETE FROM sync_outbox;
    DELETE FROM settings;
  `);
}

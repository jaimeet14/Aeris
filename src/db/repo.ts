import * as Crypto from 'expo-crypto';
import { ledgerBalance } from '../domain/balance';
import type { Direction, Entry } from '../domain/entry';
import type { Minor } from '../domain/money';
import { type Occasion, sortOccasions } from '../domain/occasions';
import { getDatabase } from './database';

export const newId = (): string => Crypto.randomUUID();

export interface Person {
  counterpartyId: string;
  ledgerId: string;
  name: string;
  currency: string;
  balanceMinor: Minor;
  lastActivityAt: number;
}

interface EntryRow {
  id: string;
  ledger_id: string;
  direction: Direction;
  amount_minor: number;
  occasion_id: string | null;
  note: string | null;
  occurred_at: number;
  recorded_at: number;
  status: Entry['status'];
  settles_entry_id: string | null;
  reverses_entry_id: string | null;
}

const toEntry = (r: EntryRow): Entry => ({
  id: r.id,
  ledgerId: r.ledger_id,
  direction: r.direction,
  amountMinor: r.amount_minor,
  occasionId: r.occasion_id,
  note: r.note,
  occurredAt: r.occurred_at,
  recordedAt: r.recorded_at,
  status: r.status,
  settlesEntryId: r.settles_entry_id,
  reversesEntryId: r.reverses_entry_id,
});

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

export async function listOccasions(): Promise<Occasion[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; label: string; is_preset: number; use_count: number }>(
    'SELECT * FROM occasion',
  );
  return sortOccasions(
    rows.map((r) => ({ id: r.id, label: r.label, isPreset: r.is_preset === 1, useCount: r.use_count })),
  );
}

export async function createOccasion(label: string): Promise<Occasion> {
  const db = await getDatabase();
  const occasion: Occasion = { id: newId(), label: label.trim(), isPreset: false, useCount: 0 };
  await db.runAsync(
    'INSERT INTO occasion (id, label, is_preset, use_count) VALUES (?, ?, 0, 0)',
    occasion.id,
    occasion.label,
  );
  return occasion;
}

/** One ledger per person. Reuses the existing one rather than opening a second. */
export async function findOrCreatePerson(name: string, currency: string): Promise<Person> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string; ledger_id: string; currency: string }>(
    `SELECT c.id, l.id AS ledger_id, l.currency
       FROM counterparty c JOIN ledger l ON l.counterparty_id = c.id
      WHERE lower(c.local_name) = lower(?) AND c.archived_at IS NULL`,
    name.trim(),
  );

  if (existing) {
    return {
      counterpartyId: existing.id,
      ledgerId: existing.ledger_id,
      name: name.trim(),
      currency: existing.currency,
      balanceMinor: await balanceOf(existing.ledger_id),
      lastActivityAt: Date.now(),
    };
  }

  const counterpartyId = newId();
  const ledgerId = newId();
  const now = Date.now();
  await db.runAsync(
    'INSERT INTO counterparty (id, local_name, phone_e164, archived_at) VALUES (?, ?, NULL, NULL)',
    counterpartyId,
    name.trim(),
  );
  await db.runAsync(
    'INSERT INTO ledger (id, counterparty_id, currency, last_activity_at) VALUES (?, ?, ?, ?)',
    ledgerId,
    counterpartyId,
    currency,
    now,
  );
  return { counterpartyId, ledgerId, name: name.trim(), currency, balanceMinor: 0, lastActivityAt: now };
}

export async function listEntries(ledgerId: string): Promise<Entry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EntryRow>(
    'SELECT * FROM entry WHERE ledger_id = ? ORDER BY occurred_at DESC, recorded_at DESC',
    ledgerId,
  );
  return rows.map(toEntry);
}

export async function balanceOf(ledgerId: string): Promise<Minor> {
  return ledgerBalance(await listEntries(ledgerId));
}

export async function listPeople(): Promise<Person[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    counterparty_id: string; ledger_id: string; name: string; currency: string; last_activity_at: number;
  }>(
    `SELECT c.id AS counterparty_id, l.id AS ledger_id, c.local_name AS name,
            l.currency, l.last_activity_at
       FROM counterparty c JOIN ledger l ON l.counterparty_id = c.id
      WHERE c.archived_at IS NULL
      ORDER BY l.last_activity_at DESC`,
  );

  return Promise.all(
    rows.map(async (r) => ({
      counterpartyId: r.counterparty_id,
      ledgerId: r.ledger_id,
      name: r.name,
      currency: r.currency,
      balanceMinor: await balanceOf(r.ledger_id),
      lastActivityAt: r.last_activity_at,
    })),
  );
}

export interface NewEntry {
  ledgerId: string;
  direction: Direction;
  amountMinor: Minor;
  occasionId: string | null;
  note: string | null;
  occurredAt: number;
  settlesEntryId?: string | null;
}

/**
 * Entries are append-only. A correction is a reversing entry and a repayment is
 * a new entry pointing at the one it settles — nothing is ever edited in place,
 * which is what keeps the time log honest.
 */
export async function addEntry(input: NewEntry): Promise<Entry> {
  const db = await getDatabase();
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new Error('An entry needs a positive amount');
  }
  const now = Date.now();
  const entry: Entry = {
    id: newId(),
    ledgerId: input.ledgerId,
    direction: input.direction,
    amountMinor: input.amountMinor,
    occasionId: input.occasionId,
    note: input.note?.trim() || null,
    occurredAt: input.occurredAt,
    recordedAt: now,
    status: 'self_recorded',
    settlesEntryId: input.settlesEntryId ?? null,
    reversesEntryId: null,
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO entry (id, ledger_id, direction, amount_minor, occasion_id, note,
                          occurred_at, recorded_at, status, settles_entry_id, reverses_entry_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      entry.id, entry.ledgerId, entry.direction, entry.amountMinor, entry.occasionId,
      entry.note, entry.occurredAt, entry.recordedAt, entry.status, entry.settlesEntryId,
    );
    await db.runAsync('UPDATE ledger SET last_activity_at = ? WHERE id = ?', now, entry.ledgerId);
    if (entry.occasionId) {
      await db.runAsync('UPDATE occasion SET use_count = use_count + 1 WHERE id = ?', entry.occasionId);
    }
  });

  return entry;
}

/** Undo without deleting: the original stays, a reversal cancels it out. */
export async function reverseEntry(entry: Entry): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO entry (id, ledger_id, direction, amount_minor, occasion_id, note,
                        occurred_at, recorded_at, status, settles_entry_id, reverses_entry_id)
     VALUES (?, ?, ?, ?, NULL, 'Reversed', ?, ?, 'self_recorded', NULL, ?)`,
    newId(),
    entry.ledgerId,
    entry.direction === 'lent' ? 'borrowed' : 'lent',
    entry.amountMinor,
    Date.now(),
    Date.now(),
    entry.id,
  );
}

export interface ActivityItem extends Entry {
  personName: string;
  currency: string;
}

export async function listActivity(limit = 100): Promise<ActivityItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EntryRow & { person_name: string; currency: string }>(
    `SELECT e.*, c.local_name AS person_name, l.currency
       FROM entry e
       JOIN ledger l ON l.id = e.ledger_id
       JOIN counterparty c ON c.id = l.counterparty_id
      ORDER BY e.recorded_at DESC
      LIMIT ?`,
    limit,
  );
  return rows.map((r) => ({ ...toEntry(r), personName: r.person_name, currency: r.currency }));
}

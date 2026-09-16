import type { Minor } from './money';

/** From the ledger owner's point of view. */
export type Direction = 'lent' | 'borrowed';

/**
 * Single-player Aeris (M1–M3) only ever writes 'self_recorded'. The rest of the
 * lifecycle arrives with the server at M5; the states live here now so nothing
 * has to be migrated when they do.
 */
export type EntryStatus =
  | 'self_recorded'
  | 'pending'
  | 'confirmed'
  | 'auto_confirmed'
  | 'disputed';

/** How long an unconfirmed entry waits before silence counts as agreement. */
export const AUTO_CONFIRM_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface Entry {
  id: string;
  ledgerId: string;
  direction: Direction;
  amountMinor: Minor;
  occasionId: string | null;
  note: string | null;
  /** When the money actually moved. The user may set this. */
  occurredAt: number;
  /** When Aeris was told. Never changes — this is the time log. */
  recordedAt: number;
  status: EntryStatus;
  /** Set when this entry is a repayment against an earlier one. */
  settlesEntryId: string | null;
  /** Set when this entry reverses an earlier one. Nothing is ever deleted. */
  reversesEntryId: string | null;
}

/** An entry counts toward a balance unless it has been reversed by another. */
export function isLive(entry: Entry, reversedIds: ReadonlySet<string>): boolean {
  return entry.status !== 'disputed' && !reversedIds.has(entry.id);
}

export function reversedEntryIds(entries: readonly Entry[]): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const e of entries) if (e.reversesEntryId) ids.add(e.reversesEntryId);
  return ids;
}

/** +ve means they owe you, -ve means you owe them. */
export function signedAmount(entry: Entry): Minor {
  return entry.direction === 'lent' ? entry.amountMinor : -entry.amountMinor;
}

export function isSettled(entry: Entry, at: number = Date.now()): boolean {
  if (entry.status === 'confirmed' || entry.status === 'auto_confirmed') return true;
  if (entry.status !== 'pending') return false;
  return at - entry.recordedAt >= AUTO_CONFIRM_WINDOW_MS;
}

/** Milliseconds until a pending entry auto-confirms; null when it is not pending. */
export function msUntilAutoConfirm(entry: Entry, at: number = Date.now()): number | null {
  if (entry.status !== 'pending') return null;
  return Math.max(0, entry.recordedAt + AUTO_CONFIRM_WINDOW_MS - at);
}

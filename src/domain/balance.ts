import { type Entry, isLive, reversedEntryIds, signedAmount } from './entry';
import type { Minor } from './money';

/**
 * Balances are DERIVED, always. Any cached balance is a convenience that can be
 * rebuilt from the entries; if a cache and this function ever disagree, this
 * function is right.
 */
export function ledgerBalance(entries: readonly Entry[]): Minor {
  const reversed = reversedEntryIds(entries);
  return entries.reduce((total, e) => (isLive(e, reversed) ? total + signedAmount(e) : total), 0);
}

export interface NetPosition {
  /** Sum of every ledger where they owe you. Always >= 0. */
  owedToYouMinor: Minor;
  /** Sum of every ledger where you owe them, as a positive number. */
  youOweMinor: Minor;
  /** owedToYou - youOwe. */
  netMinor: Minor;
}

export function netPosition(balances: readonly Minor[]): NetPosition {
  let owedToYouMinor = 0;
  let youOweMinor = 0;
  for (const b of balances) {
    if (b > 0) owedToYouMinor += b;
    else if (b < 0) youOweMinor += -b;
  }
  return { owedToYouMinor, youOweMinor, netMinor: owedToYouMinor - youOweMinor };
}

/** How much of a single debt is still outstanding, after its repayments. */
export function remainingOnDebt(debt: Entry, entries: readonly Entry[]): Minor {
  const reversed = reversedEntryIds(entries);
  if (!isLive(debt, reversed)) return 0;
  const repaid = entries
    .filter((e) => e.settlesEntryId === debt.id && isLive(e, reversed))
    .reduce((sum, e) => sum + e.amountMinor, 0);
  return Math.max(0, debt.amountMinor - repaid);
}

/** Debts still carrying a balance, oldest first — the order repayments apply in. */
export function openDebts(entries: readonly Entry[], direction: Entry['direction']): Entry[] {
  return entries
    .filter((e) => e.direction === direction && e.settlesEntryId === null)
    .filter((e) => remainingOnDebt(e, entries) > 0)
    .sort((a, b) => a.occurredAt - b.occurredAt);
}

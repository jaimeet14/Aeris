import { remainingOnDebt } from './balance';
import type { Entry } from './entry';
import type { Minor } from './money';

export interface Allocation {
  entryId: string;
  appliedMinor: Minor;
}

export interface AllocationResult {
  allocations: readonly Allocation[];
  /** Money left over when the payment exceeds everything outstanding. */
  unappliedMinor: Minor;
}

/**
 * Spread a repayment across outstanding debts, oldest first. This is the default
 * the user can override on the settle-up screen; it is deliberately boring so the
 * result is never a surprise.
 */
export function allocateOldestFirst(
  debts: readonly Entry[],
  allEntries: readonly Entry[],
  paymentMinor: Minor,
): AllocationResult {
  if (paymentMinor < 0) throw new Error('A repayment cannot be negative');
  const allocations: Allocation[] = [];
  let left = paymentMinor;

  for (const debt of [...debts].sort((a, b) => a.occurredAt - b.occurredAt)) {
    if (left === 0) break;
    const remaining = remainingOnDebt(debt, allEntries);
    if (remaining <= 0) continue;
    const applied = Math.min(remaining, left);
    allocations.push({ entryId: debt.id, appliedMinor: applied });
    left -= applied;
  }

  return { allocations, unappliedMinor: left };
}

export function totalOutstanding(debts: readonly Entry[], allEntries: readonly Entry[]): Minor {
  return debts.reduce((sum, d) => sum + remainingOnDebt(d, allEntries), 0);
}

import { allocateOldestFirst, totalOutstanding } from '../allocation';
import { ledgerBalance, netPosition, openDebts, remainingOnDebt } from '../balance';
import { AUTO_CONFIRM_WINDOW_MS, type Entry, isSettled, msUntilAutoConfirm } from '../entry';

const DAY = 24 * 60 * 60 * 1000;

function entry(over: Partial<Entry> & Pick<Entry, 'id' | 'direction' | 'amountMinor'>): Entry {
  return {
    ledgerId: 'ledger-1',
    occasionId: null,
    note: null,
    occurredAt: 0,
    recordedAt: 0,
    status: 'self_recorded',
    settlesEntryId: null,
    reversesEntryId: null,
    ...over,
  };
}

describe('ledgerBalance', () => {
  it('nets lending against borrowing', () => {
    const entries = [
      entry({ id: 'a', direction: 'lent', amountMinor: 420000 }),
      entry({ id: 'b', direction: 'borrowed', amountMinor: 180000 }),
    ];
    expect(ledgerBalance(entries)).toBe(240000);
  });

  it('brings the balance down when a repayment is recorded', () => {
    const entries = [
      entry({ id: 'a', direction: 'lent', amountMinor: 420000, occurredAt: DAY }),
      entry({ id: 'r', direction: 'borrowed', amountMinor: 200000, settlesEntryId: 'a', occurredAt: 2 * DAY }),
    ];
    expect(ledgerBalance(entries)).toBe(220000);
  });

  it('ignores an entry that has been reversed, and the reversal itself', () => {
    const entries = [
      entry({ id: 'a', direction: 'lent', amountMinor: 420000 }),
      entry({ id: 'x', direction: 'borrowed', amountMinor: 420000, reversesEntryId: 'a' }),
    ];
    expect(ledgerBalance(entries)).toBe(-420000);
    expect(remainingOnDebt(entries[0]!, entries)).toBe(0);
  });

  it('ignores disputed entries until they are resolved', () => {
    const entries = [
      entry({ id: 'a', direction: 'lent', amountMinor: 420000 }),
      entry({ id: 'b', direction: 'lent', amountMinor: 100000, status: 'disputed' }),
    ];
    expect(ledgerBalance(entries)).toBe(420000);
  });

  it('is zero for an empty ledger', () => {
    expect(ledgerBalance([])).toBe(0);
  });
});

describe('netPosition', () => {
  it('keeps the two directions separate as well as netting them', () => {
    expect(netPosition([420000, -180000, 1005000, 0])).toEqual({
      owedToYouMinor: 1425000,
      youOweMinor: 180000,
      netMinor: 1245000,
    });
  });

  it('reports nothing for someone fully settled', () => {
    expect(netPosition([0, 0])).toEqual({ owedToYouMinor: 0, youOweMinor: 0, netMinor: 0 });
  });
});

describe('remainingOnDebt', () => {
  it('subtracts every repayment against that debt', () => {
    const debt = entry({ id: 'a', direction: 'lent', amountMinor: 420000 });
    const entries = [
      debt,
      entry({ id: 'r1', direction: 'borrowed', amountMinor: 200000, settlesEntryId: 'a' }),
      entry({ id: 'r2', direction: 'borrowed', amountMinor: 100000, settlesEntryId: 'a' }),
      entry({ id: 'other', direction: 'borrowed', amountMinor: 999900, settlesEntryId: 'zzz' }),
    ];
    expect(remainingOnDebt(debt, entries)).toBe(120000);
  });

  it('never goes below zero when someone overpays', () => {
    const debt = entry({ id: 'a', direction: 'lent', amountMinor: 100000 });
    const entries = [debt, entry({ id: 'r', direction: 'borrowed', amountMinor: 150000, settlesEntryId: 'a' })];
    expect(remainingOnDebt(debt, entries)).toBe(0);
  });
});

describe('allocateOldestFirst', () => {
  const older = entry({ id: 'older', direction: 'lent', amountMinor: 200000, occurredAt: DAY });
  const newer = entry({ id: 'newer', direction: 'lent', amountMinor: 300000, occurredAt: 5 * DAY });

  it('fills the oldest debt before touching the next', () => {
    const all = [older, newer];
    const { allocations, unappliedMinor } = allocateOldestFirst(openDebts(all, 'lent'), all, 250000);
    expect(allocations).toEqual([
      { entryId: 'older', appliedMinor: 200000 },
      { entryId: 'newer', appliedMinor: 50000 },
    ]);
    expect(unappliedMinor).toBe(0);
  });

  it('stops at the payment amount', () => {
    const all = [older, newer];
    const { allocations, unappliedMinor } = allocateOldestFirst(openDebts(all, 'lent'), all, 120000);
    expect(allocations).toEqual([{ entryId: 'older', appliedMinor: 120000 }]);
    expect(unappliedMinor).toBe(0);
  });

  it('reports money it could not apply rather than inventing a debt', () => {
    const all = [older];
    const { allocations, unappliedMinor } = allocateOldestFirst(openDebts(all, 'lent'), all, 500000);
    expect(allocations).toEqual([{ entryId: 'older', appliedMinor: 200000 }]);
    expect(unappliedMinor).toBe(300000);
  });

  it('skips debts that are already square', () => {
    const all = [
      older,
      entry({ id: 'paid', direction: 'borrowed', amountMinor: 200000, settlesEntryId: 'older', occurredAt: 2 * DAY }),
      newer,
    ];
    const { allocations } = allocateOldestFirst(openDebts(all, 'lent'), all, 100000);
    expect(allocations).toEqual([{ entryId: 'newer', appliedMinor: 100000 }]);
  });

  it('refuses a negative repayment', () => {
    expect(() => allocateOldestFirst([], [], -1)).toThrow(/cannot be negative/);
  });

  it('totals what is still outstanding', () => {
    const all = [older, newer];
    expect(totalOutstanding(openDebts(all, 'lent'), all)).toBe(500000);
  });
});

describe('auto-confirm window', () => {
  const pending = entry({ id: 'p', direction: 'lent', amountMinor: 1000, status: 'pending', recordedAt: 0 });

  it('waits a full day before silence counts as agreement', () => {
    expect(isSettled(pending, AUTO_CONFIRM_WINDOW_MS - 1)).toBe(false);
    expect(isSettled(pending, AUTO_CONFIRM_WINDOW_MS)).toBe(true);
  });

  it('counts down and never goes negative', () => {
    expect(msUntilAutoConfirm(pending, 0)).toBe(AUTO_CONFIRM_WINDOW_MS);
    expect(msUntilAutoConfirm(pending, AUTO_CONFIRM_WINDOW_MS + 5000)).toBe(0);
  });

  it('does not apply to entries with no counterparty waiting', () => {
    const solo = entry({ id: 's', direction: 'lent', amountMinor: 1000 });
    expect(msUntilAutoConfirm(solo)).toBeNull();
    expect(isSettled(solo)).toBe(false);
  });
});

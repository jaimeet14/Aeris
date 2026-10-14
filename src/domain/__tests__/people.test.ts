import {
  type ActivityLine,
  activityDetail,
  describeActivity,
  groupByDay,
  happenedEarlier,
  relativeDay,
} from '../activity';
import { searchContacts, toPickable } from '../contacts';
import { cleanOccasionLabel, findOccasionByLabel, type Occasion } from '../occasions';
import { matchPerson } from '../people';
import { callingCodeForCurrency, normalizePhone } from '../phone';

describe('normalizePhone', () => {
  it('reads Indian numbers in every common shape as one E.164 number', () => {
    const want = '+919876543210';
    for (const raw of [
      '+91 98765 43210',
      '+91-98765-43210',
      '098765 43210',
      '98765 43210',
      '(98765) 43210',
      '91 98765 43210',
      '0091 98765 43210',
    ]) {
      expect(normalizePhone(raw, '91')).toBe(want);
    }
  });

  it('handles the North American trunk and exit prefixes', () => {
    expect(normalizePhone('(415) 555-0100', '1')).toBe('+14155550100');
    expect(normalizePhone('1 415 555 0100', '1')).toBe('+14155550100');
    expect(normalizePhone('011 44 20 7946 0958', '1')).toBe('+442079460958');
  });

  it('drops the national 0 for countries that dial one', () => {
    expect(normalizePhone('020 7946 0958', '44')).toBe('+442079460958');
  });

  it('trusts an explicit + over the default country', () => {
    expect(normalizePhone('+44 20 7946 0958', '91')).toBe('+442079460958');
  });

  it('refuses what it cannot read with confidence', () => {
    expect(normalizePhone('', '91')).toBeNull();
    expect(normalizePhone('call me', '91')).toBeNull();
    expect(normalizePhone('100', '91')).toBeNull();
    expect(normalizePhone('+1234567890123456', '91')).toBeNull();
    expect(normalizePhone('+0 98765 43210', '91')).toBeNull();
    // No default country: a bare national number is a guess, so it is not made.
    expect(normalizePhone('98765 43210', null)).toBeNull();
    expect(normalizePhone('+91 98765 43210', null)).toBe('+919876543210');
  });

  it('follows the chosen currency for the default country, but never guesses for EUR', () => {
    expect(callingCodeForCurrency('INR')).toBe('91');
    expect(callingCodeForCurrency('USD')).toBe('1');
    expect(callingCodeForCurrency('EUR')).toBeNull();
  });
});

describe('matchPerson', () => {
  const known = [
    { id: 'rohan-a', name: 'Rohan Mehta', phoneE164: '+919800000001' },
    { id: 'priya', name: 'Priya Shah', phoneE164: null },
  ];

  it('matches on phone before name', () => {
    expect(matchPerson(known, 'Ro', '+919800000001')).toEqual({
      kind: 'existing',
      id: 'rohan-a',
      attachPhone: null,
    });
  });

  it('keeps two people with one name apart when their numbers differ', () => {
    expect(matchPerson(known, 'Rohan Mehta', '+919800000002')).toEqual({ kind: 'new' });
  });

  it('gives a hand-typed person the number picked for them later', () => {
    expect(matchPerson(known, '  priya   shah ', '+919800000003')).toEqual({
      kind: 'existing',
      id: 'priya',
      attachPhone: '+919800000003',
    });
  });

  it('falls back to the name when no number is given', () => {
    expect(matchPerson(known, 'rohan mehta', null)).toEqual({
      kind: 'existing',
      id: 'rohan-a',
      attachPhone: null,
    });
    expect(matchPerson(known, 'Dev', null)).toEqual({ kind: 'new' });
  });
});

describe('contacts', () => {
  const rows = toPickable(
    [
      { id: '1', name: 'Rohan  Mehta', phones: ['+91 98000 00001', '098000 00001', '98000 00002'] },
      { id: '2', name: 'Ananya Kapoor', phones: [] },
      { id: '3', name: null, phones: ['98000 00003'] },
      { id: '4', name: 'Zoë Fernandes', phones: ['not a number'] },
    ],
    '91',
  );

  it('normalises, de-duplicates numbers and drops nameless contacts', () => {
    expect(rows).toEqual([
      { key: '2', name: 'Ananya Kapoor', phoneE164: null },
      { key: '1:+919800000001', name: 'Rohan Mehta', phoneE164: '+919800000001' },
      { key: '1:+919800000002', name: 'Rohan Mehta', phoneE164: '+919800000002' },
      { key: '4', name: 'Zoë Fernandes', phoneE164: null },
    ]);
  });

  it('searches by any word of the name, accents ignored, or by digits', () => {
    expect(searchContacts(rows, 'meh').map((r) => r.key)).toEqual([
      '1:+919800000001',
      '1:+919800000002',
    ]);
    expect(searchContacts(rows, 'zoe').map((r) => r.key)).toEqual(['4']);
    expect(searchContacts(rows, '00002').map((r) => r.key)).toEqual(['1:+919800000002']);
    expect(searchContacts(rows, '  ')).toHaveLength(4);
  });
});

describe('occasions', () => {
  const occasions: Occasion[] = [{ id: 'f', label: 'Food', isPreset: true, useCount: 0 }];

  it('cleans labels and refuses empty or overlong ones', () => {
    expect(cleanOccasionLabel('  Goa   trip ')).toBe('Goa trip');
    expect(() => cleanOccasionLabel('   ')).toThrow(/name/);
    expect(() => cleanOccasionLabel('x'.repeat(25))).toThrow(/characters/);
  });

  it('treats a label differing only in case as the same occasion', () => {
    expect(findOccasionByLabel(occasions, 'food')?.id).toBe('f');
    expect(findOccasionByLabel(occasions, 'Fuel')).toBeUndefined();
  });
});

describe('activity', () => {
  const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

  function line(over: Partial<ActivityLine>): ActivityLine {
    return {
      id: 'x',
      direction: 'lent',
      personName: 'Rohan',
      occasionLabel: null,
      note: null,
      occurredAt: 0,
      recordedAt: 0,
      settlesEntryId: null,
      reversesEntryId: null,
      ...over,
    };
  }

  it('says who did what from the user’s side', () => {
    expect(describeActivity(line({}))).toBe('You lent Rohan');
    expect(describeActivity(line({ direction: 'borrowed' }))).toBe('You borrowed from Rohan');
    expect(describeActivity(line({ direction: 'borrowed', settlesEntryId: 'a' }))).toBe('Rohan repaid you');
    expect(describeActivity(line({ direction: 'lent', settlesEntryId: 'a' }))).toBe('You repaid Rohan');
    expect(describeActivity(line({ reversesEntryId: 'a' }))).toBe('You reversed an entry with Rohan');
  });

  it('shows occasion and note, but not the notes Aeris writes itself', () => {
    expect(activityDetail(line({ occasionLabel: 'Tickets', note: 'row C' }))).toBe('Tickets · row C');
    expect(activityDetail(line({ note: 'Repayment' }))).toBeNull();
  });

  it('flags an entry recorded later than the money moved', () => {
    expect(happenedEarlier(line({ occurredAt: 0, recordedAt: 30_000 }))).toBe(false);
    expect(happenedEarlier(line({ occurredAt: 0, recordedAt: 3_600_000 }))).toBe(true);
  });

  it('groups by the local day recorded, newest first', () => {
    const sections = groupByDay([
      line({ id: 'a', recordedAt: at(2026, 9, 12, 9) }),
      line({ id: 'b', recordedAt: at(2026, 9, 14, 8) }),
      line({ id: 'c', recordedAt: at(2026, 9, 12, 20) }),
    ]);
    expect(sections.map((s) => s.data.map((l) => l.id))).toEqual([['b'], ['c', 'a']]);
  });

  it('names today and yesterday, and nothing older', () => {
    const now = at(2026, 10, 1, 15);
    expect(relativeDay(at(2026, 10, 1, 0), now)).toBe('Today');
    expect(relativeDay(at(2026, 9, 30, 0), now)).toBe('Yesterday');
    expect(relativeDay(at(2026, 9, 29, 0), now)).toBeNull();
  });
});

/** Someone the user already has a ledger with. */
export interface KnownPerson {
  id: string;
  name: string;
  phoneE164: string | null;
}

export type PersonMatch =
  | { kind: 'existing'; id: string; attachPhone: string | null }
  | { kind: 'new' };

export const sameName = (a: string, b: string): boolean =>
  cleanName(a).toLocaleLowerCase() === cleanName(b).toLocaleLowerCase();

export const cleanName = (name: string): string => name.trim().replace(/\s+/g, ' ');

/**
 * One ledger per person. A phone number is the stronger key: two contacts both
 * called "Rohan" with different numbers are two people, and a name typed by hand
 * before contacts were allowed is the same person once a number is picked for it.
 */
export function matchPerson(
  known: readonly KnownPerson[],
  name: string,
  phoneE164: string | null,
): PersonMatch {
  if (phoneE164) {
    const byPhone = known.find((p) => p.phoneE164 === phoneE164);
    if (byPhone) return { kind: 'existing', id: byPhone.id, attachPhone: null };

    const unnumbered = known.find((p) => p.phoneE164 === null && sameName(p.name, name));
    if (unnumbered) return { kind: 'existing', id: unnumbered.id, attachPhone: phoneE164 };

    return { kind: 'new' };
  }

  const byName = known.find((p) => sameName(p.name, name));
  return byName ? { kind: 'existing', id: byName.id, attachPhone: null } : { kind: 'new' };
}

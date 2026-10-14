import { cleanName } from './people';
import { normalizePhone } from './phone';

/** What the device address book hands over, already reduced to what Aeris reads. */
export interface RawContact {
  id: string;
  name: string | null;
  phones: readonly string[];
}

/** One row in the picker: a contact, or one of their numbers when they have several. */
export interface PickableContact {
  key: string;
  name: string;
  phoneE164: string | null;
}

/**
 * Turns the address book into picker rows. Numbers are normalised and
 * de-duplicated per contact, so a friend saved with "+91…" and "0…" variants of
 * the same mobile appears once. Contacts with no usable name are skipped.
 */
export function toPickable(
  contacts: readonly RawContact[],
  defaultCallingCode: string | null,
): PickableContact[] {
  const rows: PickableContact[] = [];
  for (const contact of contacts) {
    const name = cleanName(contact.name ?? '');
    if (!name) continue;

    const phones = [
      ...new Set(
        contact.phones
          .map((raw) => normalizePhone(raw, defaultCallingCode))
          .filter((p): p is string => p !== null),
      ),
    ];

    if (phones.length === 0) {
      rows.push({ key: contact.id, name, phoneE164: null });
    } else {
      for (const phone of phones) rows.push({ key: `${contact.id}:${phone}`, name, phoneE164: phone });
    }
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

const fold = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase();

/** Matches any word of the name by prefix, or the digits of the number. */
export function searchContacts(
  rows: readonly PickableContact[],
  query: string,
): readonly PickableContact[] {
  const q = fold(query.trim());
  if (!q) return rows;
  const digits = q.replace(/\D/g, '');
  return rows.filter((row) => {
    const name = fold(row.name);
    if (name.startsWith(q) || name.split(' ').some((word) => word.startsWith(q))) return true;
    return digits.length >= 3 && row.phoneE164 !== null && row.phoneE164.includes(digits);
  });
}

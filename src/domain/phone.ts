/**
 * Phone numbers are stored in E.164 (`+919876543210`) so the same friend saved
 * as "098765 43210" on one phone and "+91 98765-43210" on another is one person.
 * At M5 this is also the string that gets hashed for matching, so it has to be
 * canonical before anything else touches it.
 */

/**
 * The country a bare national number is assumed to belong to. Aeris has no
 * region setting, so it follows the currency the user picked — the same choice
 * they already made about where they live. EUR spans too many countries to
 * guess, so it has no default and only numbers written with a + are accepted.
 */
const CALLING_CODE_BY_CURRENCY: Readonly<Record<string, string>> = {
  INR: '91', USD: '1', CAD: '1', GBP: '44', AED: '971', SGD: '65', AUD: '61',
  JPY: '81', CHF: '41', ZAR: '27', NZD: '64', MYR: '60', LKR: '94', BDT: '880',
  NPR: '977', PKR: '92', SAR: '966', QAR: '974', THB: '66',
};

/**
 * Where every national number has one length, a number of exactly
 * country code + that length can be read as international even without the +
 * ("91 98765 43210"). Elsewhere it would be a guess, so it is not attempted.
 */
const NATIONAL_LENGTH: Readonly<Record<string, number>> = { '91': 10, '1': 10 };

/** E.164 allows at most 15 digits; fewer than 8 is never a full number. */
const MIN_DIGITS = 8;
const MAX_DIGITS = 15;

export function callingCodeForCurrency(currencyCode: string): string | null {
  return CALLING_CODE_BY_CURRENCY[currencyCode] ?? null;
}

/**
 * Returns the number in E.164, or null when it cannot be read with confidence.
 * Null is a normal outcome: the person is still recorded, just without a number.
 */
export function normalizePhone(raw: string, defaultCallingCode: string | null): string | null {
  const trimmed = raw.trim();
  const international = trimmed.startsWith('+');
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  if (!international) {
    if (digits.startsWith('00')) {
      digits = digits.slice(2);
    } else if (defaultCallingCode === '1' && digits.startsWith('011')) {
      digits = digits.slice(3);
    } else {
      if (!defaultCallingCode) return null;
      digits = withCallingCode(digits, defaultCallingCode);
    }
  }

  if (digits.startsWith('0')) return null;
  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) return null;
  return `+${digits}`;
}

function withCallingCode(national: string, code: string): string {
  const length = NATIONAL_LENGTH[code];
  if (length !== undefined) {
    if (national.length === code.length + length && national.startsWith(code)) return national;
    // North American trunk prefix: 1 415 555 0100.
    if (code === '1' && national.length === 11 && national.startsWith('1')) return national;
  }
  // Most countries dial a leading 0 inside the country and drop it abroad.
  return code + national.replace(/^0/, '');
}

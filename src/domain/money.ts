import type { Currency } from './currency';

/**
 * Money is ALWAYS an integer count of minor units — 420000 is ₹4,200.00.
 * No float ever touches a balance: 0.1 + 0.2 is how a ledger app loses trust.
 */
export type Minor = number;

export function assertMinor(value: number): asserts value is Minor {
  if (!Number.isInteger(value)) throw new Error(`Money must be an integer minor amount, got ${value}`);
  if (!Number.isSafeInteger(value)) throw new Error(`Money amount out of safe range: ${value}`);
}

/** "4200.55" -> 420055 for a 2-decimal currency. Rejects anything it cannot represent exactly. */
export function parseAmount(input: string, currency: Currency): Minor {
  const cleaned = input.replace(/[\s,]/g, '');
  if (cleaned === '') return 0;
  if (!/^\d*(\.\d*)?$/.test(cleaned)) throw new Error(`Not a valid amount: ${input}`);
  const [whole = '0', fraction = ''] = cleaned.split('.');
  if (fraction.length > currency.decimals) {
    throw new Error(`${currency.code} has ${currency.decimals} decimal places, got ${fraction.length}`);
  }
  const padded = fraction.padEnd(currency.decimals, '0');
  const value = Number(whole) * 10 ** currency.decimals + Number(padded || '0');
  assertMinor(value);
  return value;
}

/** 420000 -> "4,200" (trailing ".00" dropped), 420055 -> "4,200.55". */
export function formatAmount(minor: Minor, currency: Currency): string {
  assertMinor(minor);
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const divisor = 10 ** currency.decimals;
  const whole = Math.floor(abs / divisor);
  const fraction = abs % divisor;
  const groupedWhole = whole.toLocaleString('en-IN');
  const body =
    fraction === 0
      ? groupedWhole
      : `${groupedWhole}.${String(fraction).padStart(currency.decimals, '0')}`;
  return negative ? `-${body}` : body;
}

/** "₹4,200" — the symbol never separates from the number it belongs to. */
export function formatMoney(minor: Minor, currency: Currency): string {
  const negative = minor < 0;
  return `${negative ? '−' : ''}${currency.symbol}${formatAmount(Math.abs(minor), currency)}`;
}

/** "+₹4,200" / "−₹1,800" / "₹0" — sign carries meaning, so it is never dropped. */
export function formatSignedMoney(minor: Minor, currency: Currency): string {
  if (minor === 0) return `${currency.symbol}${formatAmount(0, currency)}`;
  const sign = minor > 0 ? '+' : '−';
  return `${sign}${currency.symbol}${formatAmount(Math.abs(minor), currency)}`;
}

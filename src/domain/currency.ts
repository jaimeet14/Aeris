/**
 * A currency is fixed on a ledger when the ledger opens. The user's own choice
 * is only the default for NEW ledgers, so changing it later never rewrites what
 * is already recorded. Aeris never converts between currencies.
 */
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  /** Digits after the decimal point. JPY has none; most have two. */
  decimals: number;
}

export const CURRENCIES: readonly Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'Pound Sterling', decimals: 2 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimals: 2 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimals: 2 },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', decimals: 2 },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', decimals: 2 },
  { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee', decimals: 2 },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', decimals: 2 },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', decimals: 2 },
  { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', decimals: 2 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', decimals: 2 },
];

export const DEFAULT_CURRENCY_CODE = 'INR';

export function currencyByCode(code: string): Currency {
  const found = CURRENCIES.find((c) => c.code === code);
  if (!found) throw new Error(`Unknown currency: ${code}`);
  return found;
}

/** Best-effort suggestion from the device locale, falling back to the default. */
export function suggestCurrency(locales: readonly string[]): Currency {
  const byRegion: Record<string, string> = {
    IN: 'INR', US: 'USD', GB: 'GBP', AE: 'AED', SG: 'SGD', AU: 'AUD', CA: 'CAD',
    JP: 'JPY', CH: 'CHF', ZA: 'ZAR', NZ: 'NZD', MY: 'MYR', LK: 'LKR', BD: 'BDT',
    NP: 'NPR', PK: 'PKR', SA: 'SAR', QA: 'QAR', TH: 'THB',
    DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', IE: 'EUR', PT: 'EUR',
  };
  for (const locale of locales) {
    const region = locale.split(/[-_]/)[1]?.toUpperCase();
    const code = region ? byRegion[region] : undefined;
    if (code) return currencyByCode(code);
  }
  return currencyByCode(DEFAULT_CURRENCY_CODE);
}

export function searchCurrencies(query: string): readonly Currency[] {
  const q = query.trim().toLowerCase();
  if (!q) return CURRENCIES;
  return CURRENCIES.filter(
    (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
  );
}

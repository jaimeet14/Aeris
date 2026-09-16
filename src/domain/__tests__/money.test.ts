import { currencyByCode, suggestCurrency } from '../currency';
import { formatAmount, formatMoney, formatSignedMoney, parseAmount } from '../money';

const INR = currencyByCode('INR');
const JPY = currencyByCode('JPY');

describe('parseAmount', () => {
  it('reads whole and fractional amounts as minor units', () => {
    expect(parseAmount('4200', INR)).toBe(420000);
    expect(parseAmount('4,200.55', INR)).toBe(420055);
    expect(parseAmount('0.05', INR)).toBe(5);
    expect(parseAmount('', INR)).toBe(0);
  });

  it('honours currencies with no decimal places', () => {
    expect(parseAmount('4200', JPY)).toBe(4200);
    expect(() => parseAmount('4200.5', JPY)).toThrow(/decimal places/);
  });

  it('refuses anything it cannot represent exactly', () => {
    expect(() => parseAmount('4200.555', INR)).toThrow(/decimal places/);
    expect(() => parseAmount('twelve', INR)).toThrow(/valid amount/);
  });

  it('never loses a paisa to floating point', () => {
    expect(parseAmount('0.10', INR) + parseAmount('0.20', INR)).toBe(30);
  });
});

describe('formatting', () => {
  it('drops empty decimals but keeps real ones', () => {
    expect(formatAmount(420000, INR)).toBe('4,200');
    expect(formatAmount(420055, INR)).toBe('4,200.55');
    expect(formatAmount(5, INR)).toBe('0.05');
  });

  it('groups in the Indian system for rupees', () => {
    expect(formatAmount(10000000, INR)).toBe('1,00,000');
    expect(formatAmount(1000000000, INR)).toBe('1,00,00,000');
  });

  it('keeps the symbol against the number', () => {
    expect(formatMoney(420000, INR)).toBe('₹4,200');
    expect(formatMoney(-180000, INR)).toBe('−₹1,800');
  });

  it('always shows the sign when direction matters', () => {
    expect(formatSignedMoney(1245000, INR)).toBe('+₹12,450');
    expect(formatSignedMoney(-180000, INR)).toBe('−₹1,800');
    expect(formatSignedMoney(0, INR)).toBe('₹0');
  });
});

describe('suggestCurrency', () => {
  it('reads the region out of a locale', () => {
    expect(suggestCurrency(['en-IN']).code).toBe('INR');
    expect(suggestCurrency(['ja-JP']).code).toBe('JPY');
    expect(suggestCurrency(['de-DE']).code).toBe('EUR');
  });

  it('falls back rather than guessing', () => {
    expect(suggestCurrency(['xx']).code).toBe('INR');
    expect(suggestCurrency([]).code).toBe('INR');
  });
});

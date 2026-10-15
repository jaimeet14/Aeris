/**
 * Electric lime. A near-black ground with soft raised cards, and the icon's
 * lime for the live action. Money has its own two colours: lime for
 * what is owed to you, coral for what you owe. Everything else is text.
 */
export const color = {
  ground: '#0B0C0A',
  groundDeep: '#070806',
  panel: '#161814',
  raised: '#20231C',
  rule: '#2D3127',
  ruleSoft: '#20231C',
  ink: '#F5F7F2',
  inkSoft: '#D6DACF',
  muted: '#959B8A',
  dim: '#646A5B',
  faint: '#3B4034',
  accent: '#C6F432',
  accentInk: '#0C0E08',
  accentWash: '#1E2610',
  accentRule: '#4D5E16',
  /** Money owed to you. The brand lime doubles as "in your favour". */
  gain: '#C6F432',
  gainWash: '#1E2610',
  /** Money you owe. */
  owe: '#FF7A6E',
  oweWash: '#2D1716',
  oweRule: '#5A2A27',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export const radius = { none: 0, sm: 10, md: 16, lg: 24, pill: 999 } as const;

/** Minimum hit target. Nothing tappable is ever smaller than this. */
export const TOUCH = 44;

export const type = {
  display: { fontSize: 44, fontWeight: '700', letterSpacing: -1.4 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.6 },
  heading: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  amount: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  bodyStrong: { fontSize: 16, fontWeight: '600' },
  small: { fontSize: 13.5, fontWeight: '400' },
  /** Quiet caption above a value. Sentence case, never shouted. */
  label: { fontSize: 13, fontWeight: '500' },
} as const;

/** Signed balance → its colour: green when owed to you, coral when you owe. */
export function moneyTone(signedMinor: number): string {
  if (signedMinor > 0) return color.gain;
  if (signedMinor < 0) return color.owe;
  return color.dim;
}

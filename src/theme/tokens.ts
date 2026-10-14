/**
 * Midnight. The ground is a violet-black taken from the app icon, and one
 * colour does the work: violet marks money you owe, the live action, and
 * nothing else. Everything else is text on the dark ground.
 */
export const color = {
  ground: '#0E0C18',
  groundDeep: '#0A0812',
  panel: '#18142A',
  rule: '#2D2742',
  ruleSoft: '#221D34',
  ink: '#F2F0F7',
  inkSoft: '#D6D2E2',
  muted: '#8B86A3',
  dim: '#5F5A78',
  faint: '#3B3652',
  accent: '#A47BFF',
  accentInk: '#0E0C18',
  accentWash: '#221A40',
  accentRule: '#45337F',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 18, xl: 22, xxl: 30 } as const;

export const radius = { none: 0, sm: 3 } as const;

/** Minimum hit target. Nothing tappable is ever smaller than this. */
export const TOUCH = 44;

export const type = {
  display: { fontSize: 46, fontWeight: '600', letterSpacing: -1.6 },
  title: { fontSize: 20, fontWeight: '600', letterSpacing: -0.6 },
  amount: { fontSize: 16.5, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyStrong: { fontSize: 15, fontWeight: '500' },
  small: { fontSize: 12.5, fontWeight: '400' },
  /** Uppercase, tracked out. Every label in the app uses this. */
  label: { fontSize: 9.5, fontWeight: '500', letterSpacing: 1.8, textTransform: 'uppercase' },
} as const;

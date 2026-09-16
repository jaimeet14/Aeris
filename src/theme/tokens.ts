/**
 * Carbon. One colour in the whole app: amber marks money you owe, the live
 * action, and nothing else. Everything else is text on near-black.
 */
export const color = {
  ground: '#0D0D0F',
  groundDeep: '#0A0A0C',
  panel: '#17171B',
  rule: '#2B2B31',
  ruleSoft: '#222227',
  ink: '#F2F2F0',
  inkSoft: '#D5D5D2',
  muted: '#87878F',
  dim: '#5C5C63',
  faint: '#3A3A42',
  amber: '#E0A43B',
  amberInk: '#0D0D0F',
  amberWash: '#241D0C',
  amberRule: '#4A3A18',
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

export interface Occasion {
  id: string;
  label: string;
  isPreset: boolean;
  useCount: number;
}

/** Seeded on first launch. Users add their own; ordering follows use. */
export const PRESET_OCCASIONS: readonly Omit<Occasion, 'useCount'>[] = [
  { id: 'preset-food', label: 'Food', isPreset: true },
  { id: 'preset-tickets', label: 'Tickets', isPreset: true },
  { id: 'preset-rent', label: 'Rent', isPreset: true },
  { id: 'preset-travel', label: 'Travel', isPreset: true },
  { id: 'preset-cash', label: 'Cash', isPreset: true },
  { id: 'preset-bills', label: 'Bills', isPreset: true },
  { id: 'preset-shopping', label: 'Shopping', isPreset: true },
  { id: 'preset-medical', label: 'Medical', isPreset: true },
  { id: 'preset-other', label: 'Other', isPreset: true },
];

export function sortOccasions(occasions: readonly Occasion[]): Occasion[] {
  return [...occasions].sort(
    (a, b) => b.useCount - a.useCount || a.label.localeCompare(b.label),
  );
}

export const MAX_OCCASION_LABEL = 24;

/** Trims and collapses spaces; throws when nothing usable is left. */
export function cleanOccasionLabel(raw: string): string {
  const label = raw.trim().replace(/\s+/g, ' ');
  if (!label) throw new Error('Give the occasion a name');
  if (label.length > MAX_OCCASION_LABEL) {
    throw new Error(`Keep it under ${MAX_OCCASION_LABEL + 1} characters`);
  }
  return label;
}

/** "food" and "Food" are one occasion, so adding it twice reuses the first. */
export function findOccasionByLabel(
  occasions: readonly Occasion[],
  label: string,
): Occasion | undefined {
  const key = label.toLocaleLowerCase();
  return occasions.find((o) => o.label.toLocaleLowerCase() === key);
}

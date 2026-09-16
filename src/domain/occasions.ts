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

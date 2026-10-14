import type { Direction } from './entry';

/** An entry as the time log shows it, across every person. */
export interface ActivityLine {
  id: string;
  direction: Direction;
  personName: string;
  occasionLabel: string | null;
  note: string | null;
  occurredAt: number;
  recordedAt: number;
  settlesEntryId: string | null;
  reversesEntryId: string | null;
}

/** Below this, the two timestamps are the same moment and only one is shown. */
const SAME_MOMENT_MS = 60 * 1000;

/** One sentence in the user's voice: who did what. */
export function describeActivity(line: ActivityLine): string {
  const who = line.personName;
  if (line.reversesEntryId) return `You reversed an entry with ${who}`;
  if (line.settlesEntryId) {
    return line.direction === 'borrowed' ? `${who} repaid you` : `You repaid ${who}`;
  }
  return line.direction === 'lent' ? `You lent ${who}` : `You borrowed from ${who}`;
}

/** Occasion and note, minus the boilerplate notes Aeris writes itself. */
export function activityDetail(line: ActivityLine): string | null {
  const note = line.note === 'Repayment' || line.note === 'Reversed' ? null : line.note;
  const parts = [line.occasionLabel, note].filter((p): p is string => !!p);
  return parts.length ? parts.join(' · ') : null;
}

/**
 * The log is ordered by when Aeris was told. When the money moved at a
 * different time, the row says so — that gap is what the time log is for.
 */
export function happenedEarlier(line: ActivityLine): boolean {
  return Math.abs(line.recordedAt - line.occurredAt) >= SAME_MOMENT_MS;
}

export function startOfDay(at: number): number {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface DaySection<T> {
  dayStart: number;
  data: T[];
}

/** Groups lines by the local day they were recorded, newest first. */
export function groupByDay<T extends { recordedAt: number }>(
  lines: readonly T[],
): DaySection<T>[] {
  const sorted = [...lines].sort((a, b) => b.recordedAt - a.recordedAt);
  const sections: DaySection<T>[] = [];
  for (const line of sorted) {
    const dayStart = startOfDay(line.recordedAt);
    const last = sections[sections.length - 1];
    if (last && last.dayStart === dayStart) last.data.push(line);
    else sections.push({ dayStart, data: [line] });
  }
  return sections;
}

/** "Today" and "Yesterday" by name; any other day is left for the UI to format. */
export function relativeDay(dayStart: number, now: number): 'Today' | 'Yesterday' | null {
  const today = startOfDay(now);
  if (dayStart === today) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return dayStart === yesterday.getTime() ? 'Yesterday' : null;
}

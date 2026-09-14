/**
 * Date formatting for the timing-sheet voice.
 * Fixed three-letter months, uppercase, no locale surprises
 * (Intl gives "Sept" in some ICU builds, which breaks the column rhythm).
 */
const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

function parts(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return { year, month, day };
}

/** "06 SEP 2026" */
export function raceDate(iso: string): string {
  const { year, month, day } = parts(iso);
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}`;
}

/** "25 - 27 SEP 2026", or a single date when there is no range. */
export function raceDateRange(startIso: string, endIso?: string): string {
  if (!endIso || endIso === startIso) return raceDate(startIso);
  const a = parts(startIso);
  const b = parts(endIso);
  const start =
    a.year === b.year && a.month === b.month
      ? String(a.day).padStart(2, '0')
      : `${String(a.day).padStart(2, '0')} ${MONTHS[a.month - 1]}`;
  return `${start} - ${raceDate(endIso)}`;
}

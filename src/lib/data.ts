/**
 * The only place the site sorts or selects records.
 *
 * `src/data/*.json` is written by the Artemis Discord bot (see
 * `docs/data-contract.md`). The bot promises a sort order, but a hand edit can
 * break it, so every reader here re-sorts instead of trusting the file. Nothing
 * in this module reaches for `Date.now()` except where a caller passes today in.
 */

export interface RaceResult {
  id: string;
  date: string;
  event: string;
  track: string;
  series: string;
  class: string;
  position: number;
  entries?: number;
  drivers: string[];
  note?: string;
}

export interface Driver {
  id: string;
  name: string;
  role: 'driver' | 'pitwall' | 'staff' | string;
  group: 'road' | 'oval' | 'crew' | string;
  number: string;
  country: string;
  focus: string;
  bio?: string;
  stats?: { irating?: number; licence?: string };
  socials?: Record<string, string>;
  active?: boolean;
}

export interface RaceEvent {
  id: string;
  name: string;
  track: string;
  start: string;
  end?: string;
  classes: string[];
  status: 'planned' | 'confirmed' | 'done' | 'skipped' | string;
  note?: string;
}

/* Results ----------------------------------------------------------- */

/** Contract order: date descending, then position ascending. */
export function sortResults(results: RaceResult[]): RaceResult[] {
  return [...results].sort(
    (a, b) => b.date.localeCompare(a.date) || a.position - b.position
  );
}

/** Home "Recent results" takes the first 6; the partners dossier the first 3. */
export function recentResults(results: RaceResult[], count: number): RaceResult[] {
  return sortResults(results).slice(0, count);
}

/**
 * Hero proof row: the best finish among the three newest races, so the first
 * screen is current rather than cherry-picked from the whole season.
 * Ties go to the newer race, which sortResults already puts first.
 */
export function heroProof(results: RaceResult[]): RaceResult | undefined {
  const newest = sortResults(results).slice(0, 3);
  if (!newest.length) return undefined;
  return newest.reduce((best, row) => (row.position < best.position ? row : best));
}

/** The most recent race a driver appears in, matched on `name`. */
export function latestFinish(
  results: RaceResult[],
  driverName: string
): RaceResult | undefined {
  return sortResults(results).find((row) => row.drivers.includes(driverName));
}

/** How many of these results were podiums. */
export function podiumCount(results: RaceResult[]): number {
  return results.filter((row) => row.position <= 3).length;
}

/** Distinct series, newest race first, for the partners season summary. */
export function seriesRun(results: RaceResult[]): string[] {
  return [...new Set(sortResults(results).map((row) => row.series))];
}

/* Drivers ----------------------------------------------------------- */

const GROUP_ORDER = ['road', 'oval', 'crew'];

/** Contract order: road, oval, crew; then car number ascending; crew by name. */
export function sortDrivers(drivers: Driver[]): Driver[] {
  return [...drivers].sort((a, b) => {
    const group = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
    if (group !== 0) return group;
    if (a.group === 'crew') return a.name.localeCompare(b.name);
    return Number(a.number || 0) - Number(b.number || 0) || a.name.localeCompare(b.name);
  });
}

/** `active: false` keeps a record in the file but off the site. */
export function activeDrivers(drivers: Driver[]): Driver[] {
  return sortDrivers(drivers).filter((driver) => driver.active !== false);
}

/** Home teaser: the first four active drivers (crew and staff excluded). */
export function featuredDrivers(drivers: Driver[], count: number): Driver[] {
  return activeDrivers(drivers)
    .filter((driver) => driver.role === 'driver')
    .slice(0, count);
}

export function driversInGroup(drivers: Driver[], group: string): Driver[] {
  return activeDrivers(drivers).filter((driver) => driver.group === group);
}

/* Events ------------------------------------------------------------ */

/** The event a visitor should see next: first upcoming, planned or confirmed. */
export function nextEvent(events: RaceEvent[], today: string): RaceEvent | undefined {
  return upcomingEvents(events, today)[0];
}

/** Every upcoming entry, so "next race" can also list what follows it. */
export function upcomingEvents(events: RaceEvent[], today: string): RaceEvent[] {
  return [...events]
    .filter((event) => event.status === 'planned' || event.status === 'confirmed')
    .filter((event) => (event.end ?? event.start) >= today)
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Fallback subtitle when nothing is scheduled: the last race actually run. */
export function lastCompletedEvent(events: RaceEvent[]): RaceEvent | undefined {
  return [...events]
    .filter((event) => event.status === 'done')
    .sort((a, b) => b.start.localeCompare(a.start))[0];
}

/**
 * The countdown target: midnight on the start date in the team's timezone
 * (America/Chicago), expressed in UTC so the browser can subtract it from its
 * own clock. US DST runs from the second Sunday in March to the first Sunday in
 * November, both switching at 02:00 local, so a date's own midnight is still on
 * the previous offset on each of those two days.
 */
export function countdownTarget(startDate: string): string {
  const year = Number(startDate.slice(0, 4));
  const dstStart = nthSundayOfMonth(year, 3, 2);
  const dstEnd = nthSundayOfMonth(year, 11, 1);
  const daylight = startDate > dstStart && startDate <= dstEnd;
  return `${startDate}T0${daylight ? 5 : 6}:00:00Z`;
}

function nthSundayOfMonth(year: number, month: number, nth: number): string {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const day = 1 + ((7 - first.getUTCDay()) % 7) + (nth - 1) * 7;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Today in the team's timezone, for build-time "is this race still ahead". */
export function todayInTeamZone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

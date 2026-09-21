/**
 * The routes every page-level check runs against.
 *
 * `/join` was missing from this list until the driver pages landed, which
 * meant the site's primary recruiting funnel - the page the header button
 * points at on four of six routes - had no axe pass, no console-error check
 * and no title-uniqueness check. It has them now.
 *
 * One driver page stands in for all of them: they share a template, so a
 * second adds runtime without adding coverage. `mateo-ferreira` is the first
 * record in `src/data/drivers.json`; if that file is ever emptied this path
 * has to change with it (`tests/empty-data-build.mjs` restores the file, so
 * the suite never sees it empty).
 */
export const ROUTES = [
  { name: 'home', path: '/', status: 200 },
  { name: 'team', path: '/team', status: 200 },
  { name: 'driver', path: '/team/mateo-ferreira', status: 200 },
  { name: 'join', path: '/join', status: 200 },
  { name: 'standings', path: '/standings', status: 200 },
  { name: 'about', path: '/about', status: 200 },
  { name: 'partners', path: '/partners', status: 200 },
  { name: 'privacy', path: '/privacy', status: 200 },
  { name: 'terms', path: '/terms', status: 200 },
  { name: '404', path: '/this-page-does-not-exist', status: 404 },
] as const;

/**
 * Every page that renders, driver page and all. Use this for checks that
 * are about the page itself - its layout, its copy, its markup - rather
 * than about navigation. `REAL_PAGES` below is a NAV subset and excludes
 * /standings, /privacy, /terms and the driver pages; reaching for it by
 * name cost two guards their coverage before this constant existed.
 */
export const ALL_PAGES = ROUTES.filter((r) => r.status === 200);

/**
 * The pages that carry a nav entry, where "one page, one nav entry" checks
 * apply. Driver pages are deliberately not here: they are reached from the
 * roster, not from the header, and `nav.json` has no line for them.
 */
/* `/standings` is not here either, and will not be until there is a league:
   its nav line in `nav.json` is held back while the table is empty, so the
   page has no nav entry to check against. `/privacy` and `/terms` are
   deliberately never here - they live in the footer's base row, not in
   `nav.json`, because they are not what anyone came for. */
const NAV_PATHS = new Set(['/', '/team', '/join', '/about', '/partners']);
export const REAL_PAGES = ROUTES.filter(
  (r) => r.status === 200 && NAV_PATHS.has(r.path)
);

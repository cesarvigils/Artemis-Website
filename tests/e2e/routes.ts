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
  { name: 'about', path: '/about', status: 200 },
  { name: 'partners', path: '/partners', status: 200 },
  { name: '404', path: '/this-page-does-not-exist', status: 404 },
] as const;

/**
 * The pages that carry a nav entry, where "one page, one nav entry" checks
 * apply. Driver pages are deliberately not here: they are reached from the
 * roster, not from the header, and `nav.json` has no line for them.
 */
const NAV_PATHS = new Set(['/', '/team', '/join', '/about', '/partners']);
export const REAL_PAGES = ROUTES.filter(
  (r) => r.status === 200 && NAV_PATHS.has(r.path)
);

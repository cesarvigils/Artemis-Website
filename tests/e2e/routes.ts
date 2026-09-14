/** The site's five routes: four real pages plus the not-found fallback. */
export const ROUTES = [
  { name: 'home', path: '/', status: 200 },
  { name: 'team', path: '/team', status: 200 },
  { name: 'about', path: '/about', status: 200 },
  { name: 'partners', path: '/partners', status: 200 },
  { name: '404', path: '/this-page-does-not-exist', status: 404 },
] as const;

/** The four real pages only, where "one page, one nav entry" checks apply. */
export const REAL_PAGES = ROUTES.filter((r) => r.status === 200);

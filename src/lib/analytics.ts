/**
 * Umami Cloud, env-gated.
 *
 * The tag is injected only when `PUBLIC_UMAMI_WEBSITE_ID` is set at build
 * time, so a preview or a local build ships no third-party script at all and
 * the footer keeps saying "no analytics". `PUBLIC_UMAMI_SRC` exists for a
 * self-hosted or proxied instance; it defaults to Umami Cloud.
 *
 * Umami is cookieless and stores no personal data, which is why the site can
 * measure a CTA without a consent banner. Both variables are documented in
 * README.md and DEPLOY.md and are set on the Vercel project.
 */
const id = import.meta.env.PUBLIC_UMAMI_WEBSITE_ID;
const src = import.meta.env.PUBLIC_UMAMI_SRC;

export const umamiWebsiteId: string = typeof id === 'string' ? id.trim() : '';
export const umamiSrc: string =
  typeof src === 'string' && src.trim() ? src.trim() : 'https://cloud.umami.is/script.js';

/** True only when a website id was supplied to this build. */
export const analyticsEnabled: boolean = umamiWebsiteId.length > 0;

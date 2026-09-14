import site from '../data/site.json';

/** The one Discord invite every "Join the team" button points at. */
export const discordInvite = site.socials.discord;

/**
 * The partnership contact. One address, one subject line, one label, used by
 * the nav on /partners, the page head action and the contact card, so a sponsor
 * never sees two different words for the same next step.
 */
export const partnershipMailto = `mailto:${site.contactEmail}?subject=Partnership%20enquiry`;

/**
 * `short` is the phone header's label. The compact CTA sits in a 320px bar
 * beside a 44px hamburger, and `.btn` is `white-space: nowrap`, so a
 * 13-character label has an unshrinkable min-content width that pushed the
 * only navigation control off the device. The anchor keeps the full label as
 * its accessible name, so nothing is lost to a screen reader.
 */
export const CTA_INTENTS: Record<
  string,
  { href: string; label: string; short: string; external: boolean }
> = {
  join: { href: discordInvite, label: 'Join the team', short: 'Join', external: true },
  partnership: {
    href: partnershipMailto,
    label: 'Partner with us',
    short: 'Partner',
    external: false,
  },
};

/**
 * "You are here", in one place. The header marked the current page and the
 * footer never did, and the home page carried no marker at all, because the
 * primary nav's first entry is an anchor *into* home rather than a link to
 * it. The footer's list does contain `/`, so sharing this is what gives the
 * home page a marker.
 *
 * An href carrying a fragment is never "the current page": it is a place
 * inside one, and `/#results` marked as `aria-current="page"` would be a
 * claim the reader can disprove by scrolling.
 */
export function isCurrent(href: string, pathname: string): boolean {
  if (href.includes('#')) return false;
  const normalise = (value: string) => value.replace(/\/+$/, '') || '/';
  return normalise(href) === normalise(pathname);
}

const SOCIAL_LABELS: Record<string, string> = {
  discord: 'Discord',
  x: 'X',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitch: 'Twitch',
};

/**
 * The public channel list, built once. The footer guarded `site.store` and
 * `/partners` did not, so an empty store URL gave the sponsor page a
 * `href=""` link with `target="_blank"` - a new tab that reloads the page it
 * was opened from. One builder, one guard, two consumers.
 */
export function channelLinks(
  socials: Record<string, string>,
  store?: string
): { label: string; url: string }[] {
  return [
    ...Object.entries(socials)
      .filter(([, url]) => url)
      .map(([key, url]) => ({ label: SOCIAL_LABELS[key] ?? key, url })),
    ...(store ? [{ label: 'Store', url: store }] : []),
  ];
}

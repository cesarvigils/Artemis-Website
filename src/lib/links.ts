import site from '../data/site.json';

/** The one Discord invite every "Join the team" button points at. */
export const discordInvite = site.socials.discord;

/**
 * The partnership contact. One address, one subject line, one label, used by
 * the nav on /partners, the page head action and the contact card, so a sponsor
 * never sees two different words for the same next step.
 */
export const partnershipMailto = `mailto:${site.contactEmail}?subject=Partnership%20enquiry`;

export const CTA_INTENTS: Record<string, { href: string; label: string; external: boolean }> = {
  join: { href: discordInvite, label: 'Join the team', external: true },
  partnership: { href: partnershipMailto, label: 'Partner with us', external: false },
};

import { hasValue, studio } from '@/config/studio.config';
import { formatPhoneHref } from '@/lib/format';

/** `tel:` href for the studio phone, or null while the phone is a placeholder. */
export function callHref(): string | null {
  return formatPhoneHref(studio.phone) || null;
}

/**
 * Where "book an appointment" goes: the booking service if it is configured,
 * otherwise the phone. Null means neither is filled in — the button is then
 * rendered disabled rather than pointing nowhere (story 45).
 */
export function bookingHref(): string | null {
  if (hasValue(studio.bookingUrl)) return studio.bookingUrl;
  return callHref();
}

/** Social links the owner actually filled in; an empty list hides the block. */
export function activeSocials(): Array<{ id: string; href: string }> {
  return Object.entries(studio.socials)
    .filter(([, href]) => hasValue(href))
    .map(([id, href]) => ({ id, href }));
}

/** Messenger links the owner actually filled in. */
export function activeMessengers(): Array<{ id: string; href: string }> {
  return Object.entries(studio.messengers)
    .filter(([, href]) => hasValue(href))
    .map(([id, href]) => ({ id, href }));
}

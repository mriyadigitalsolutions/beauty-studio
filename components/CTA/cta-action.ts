/**
 * Where the one button of the last screen goes (story 15, 45).
 *
 * What the button says is decided by the source, not by comparing two
 * strings: `bookingConfigured` is `hasValue(studio.bookingUrl)`, so a studio
 * whose booking link happens to equal its phone still reads as "book". With
 * nothing configured at all there is nothing to link to, and the honest
 * answer is a disabled button with a reason next to it.
 */

export type CtaKind = 'booking' | 'call' | 'none';

export interface CtaAction {
  kind: CtaKind;
  href: string | null;
  disabled: boolean;
}

export function ctaAction(
  bookingConfigured: boolean,
  booking: string | null,
  call: string | null,
): CtaAction {
  if (bookingConfigured && booking) return { kind: 'booking', href: booking, disabled: false };
  if (call) return { kind: 'call', href: call, disabled: false };
  return { kind: 'none', href: null, disabled: true };
}

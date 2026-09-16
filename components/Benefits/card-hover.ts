/**
 * The one thing Framer Motion does on this site besides the menu and the
 * cursor (§2): the lift a card makes under the pointer. It stays here, off
 * the scroll timeline, so GSAP and Framer never write the same transform —
 * GSAP moves the slot, Framer moves the card inside it.
 */

export const HOVER_LIFT = { y: -8, scale: 1.015 } as const;

export const HOVER_SPRING = { type: 'spring', stiffness: 260, damping: 24, mass: 0.6 } as const;

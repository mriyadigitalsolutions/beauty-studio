'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './NavMenu.module.css';

/*
 * The menu of the header (story 28). Framer Motion again, for the same reason
 * as the cursor: opening a panel has nothing to do with the scroll (§2), and
 * a GSAP timeline here would be a second owner of the same 180 ms.
 *
 * The keyboard contract of §12 is the whole point of the component: Escape
 * closes and hands the focus back, a click outside closes, and while it is
 * open Tab cannot walk out of it into the film behind.
 */

export interface NavMenuItem {
  /** `#`-anchor of the section — Lenis smooths the jump (R11.1). */
  href: string;
  label: string;
}

export interface NavMenuProps {
  items: readonly NavMenuItem[];
  /** Accessible name of the button when the menu is closed, and when open. */
  openLabel: string;
  closeLabel: string;
}

const FOCUSABLE = 'a[href], button:not([disabled])';

export function NavMenu({ items, openLabel, closeLabel }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  const toggle = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLUListElement | null>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggle.current?.focus();
  }, []);

  /*
   * Choosing an item closes the panel under the focused link, so the focus has
   * to be put somewhere on purpose: the section the visitor just asked for.
   * Without this the next Tab starts again at the top of the document, which
   * is exactly the tab order §12 promises not to break. `preventScroll`
   * because the anchor is already taking them there, smoothly.
   */
  const followTo = useCallback((href: string) => {
    close(false);
    const section = document.getElementById(href.slice(1));
    if (!section) {
      toggle.current?.focus();
      return;
    }
    if (!section.hasAttribute('tabindex')) section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });
  }, [close]);

  useEffect(() => {
    if (!open) return;

    /* The first item takes the focus, so the trap below has something to
       trap — and so a keyboard visitor is already inside the menu. */
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== 'Tab') return;

      const container = root.current;
      if (!container) return;
      const stops = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (stops.length === 0) return;

      const edge = event.shiftKey ? stops[0] : stops[stops.length - 1];
      const wrap = event.shiftKey ? stops[stops.length - 1] : stops[0];
      const active = document.activeElement;
      if (active === edge || !container.contains(active)) {
        event.preventDefault();
        wrap?.focus();
      }
    };

    /* Pointerdown, not click: the menu has to be gone before whatever was
       clicked outside it gets its own turn. */
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && root.current?.contains(target)) return;
      close(false); // the click has its own destination; do not steal the focus
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, close]);

  return (
    <div className={styles.root} ref={root} data-nav-menu="">
      <button
        type="button"
        ref={toggle}
        className={styles.toggle}
        data-nav-toggle=""
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((value) => !value)}
      >
        <motion.span animate={{ y: open ? 3 : 0, rotate: open ? 45 : 0 }} transition={{ duration: 0.18 }} />
        <motion.span animate={{ y: open ? -2 : 0, rotate: open ? -45 : 0 }} transition={{ duration: 0.18 }} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            id="site-menu"
            ref={panel}
            className={styles.panel}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {items.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={() => followTo(item.href)}>
                  {item.label}
                </a>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

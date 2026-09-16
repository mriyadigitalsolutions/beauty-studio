'use client';

import Link from 'next/link';
import type { MouseEventHandler, ReactNode } from 'react';
import styles from './PillButton.module.css';

export type PillVariant = 'solid' | 'ghost';
export type PillSize = 'sm' | 'md' | 'lg';

export interface PillButtonProps {
  children: ReactNode;
  /** White pill (default) or transparent one. */
  variant?: PillVariant;
  size?: PillSize;
  /** Internal path, external url, `tel:` or `#anchor`. Omit for a button. */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  /** Renders a non-interactive pill — used when a target is not configured. */
  disabled?: boolean;
  title?: string;
  className?: string;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
}

/**
 * The only way a button or button-like link is drawn on this site: pill shape,
 * glass, soft shadow. Nothing outside this file styles a button.
 */
export function PillButton({
  children,
  variant = 'solid',
  size = 'md',
  href,
  onClick,
  disabled = false,
  title,
  className,
  ...aria
}: PillButtonProps) {
  const classes = [styles.pill, styles[variant], styles[size], disabled ? styles.disabled : '', className]
    .filter(Boolean)
    .join(' ');

  if (disabled || !href) {
    return (
      <button type="button" className={classes} onClick={onClick} disabled={disabled} title={title} {...aria}>
        {children}
      </button>
    );
  }

  const isExternal = /^(https?:|tel:|mailto:)/.test(href);
  if (isExternal) {
    return (
      <a
        className={classes}
        href={href}
        title={title}
        onClick={onClick}
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        {...aria}
      >
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={href} title={title} onClick={onClick} {...aria}>
      {children}
    </Link>
  );
}

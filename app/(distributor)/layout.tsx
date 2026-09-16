import type { Metadata } from 'next';
import '../globals.css';
import { defaultLocale } from '@/content/locales';

export const metadata: Metadata = {
  title: 'Laser hair removal studio',
  robots: { index: false, follow: true },
};

/**
 * Root layout of the language distributor at `/`. The site itself lives under
 * `/[locale]`, which has its own root layout with the right `lang`.
 */
export default function DistributorLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={defaultLocale}>
      <body>{children}</body>
    </html>
  );
}

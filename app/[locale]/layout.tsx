import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Bodoni_Moda, Cormorant_Garamond, Inter } from 'next/font/google';
import '../globals.css';
import { SiteHeader } from '@/components/layout/SiteHeader/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter/SiteFooter';
import { GlowCursor } from '@/components/GlowCursor/GlowCursor';
import { SceneProgress } from '@/components/SceneProgress/SceneProgress';
import { studio } from '@/config/studio.config';
import { getDictionary } from '@/content';
import { defaultLocale, isLocale, locales, type Locale } from '@/content/locales';
import { localePath } from '@/lib/i18n';
import { MotionProvider } from '@/lib/motion';

/* Self-hosted through next/font: not a single request for a font at runtime. */
const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bodoni',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-cormorant',
});

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

export const dynamicParams = false;

/*
 * A static export is uploaded to a domain nobody here knows, so the absolute
 * urls of the link card can only come from the outside. With
 * `NEXT_PUBLIC_SITE_URL` set (see `.env.example`) the canonical, the hreflangs
 * and the og image are absolute; without it they stay root-relative, which is
 * what a scraper resolves against the page it is reading anyway.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const metadataBase = siteUrl ? new URL(siteUrl) : undefined;

/*
 * Drawn from `studio.monogram` and the palette by `scripts/prepare-brand.mjs`.
 * The tag is written by hand rather than through `openGraph.images`, because
 * that path rewrites the url against `metadataBase` and, with no site address
 * configured, would ship every link card pointing at localhost. Root-relative
 * is resolved against the page the scraper is reading; set
 * `NEXT_PUBLIC_SITE_URL` and it becomes absolute.
 */
const OG_IMAGE = '/og/og-image.png';
const ogImageUrl = siteUrl ? new URL(OG_IMAGE, siteUrl).toString() : OG_IMAGE;
const ICONS = {
  icon: [
    { url: '/icons/favicon.ico', sizes: '32x32' },
    { url: '/icons/icon.svg', type: 'image/svg+xml' },
    { url: '/icons/favicon-32.png', type: 'image/png', sizes: '32x32' },
    { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
    { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
  ],
  apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
};

export function generateStaticParams(): Array<{ locale: Locale }> {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { meta } = getDictionary(locale);

  return {
    metadataBase,
    title: meta.title,
    description: meta.description,
    applicationName: studio.name,
    alternates: {
      canonical: localePath(locale),
      languages: {
        ...Object.fromEntries(locales.map((code) => [code, localePath(code)])),
        'x-default': localePath(defaultLocale),
      },
    },
    icons: ICONS,
    openGraph: {
      type: 'website',
      locale,
      alternateLocale: locales.filter((code) => code !== locale),
      url: localePath(locale),
      siteName: studio.name,
      title: meta.title,
      description: meta.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);

  return (
    <html lang={locale} className={`${bodoni.variable} ${cormorant.variable} ${inter.variable}`}>
      <body>
        {/* React 19 hoists these into <head>; see the note on `OG_IMAGE`. */}
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={dictionary.meta.ogAlt} />
        <meta name="twitter:image" content={ogImageUrl} />
        <a className="skipLink" href="#main">
          {dictionary.nav.skipToContent}
        </a>
        <SiteHeader locale={locale} dictionary={dictionary} />
        <main id="main">
          <MotionProvider>
            {/* Inside the provider: the rail reads the one scroll loop, and
                outside it there is no runtime to read. It is a fixed layer,
                so where it sits in the markup changes nothing on screen. */}
            <SceneProgress dictionary={dictionary} />
            {children}
          </MotionProvider>
        </main>
        <SiteFooter locale={locale} dictionary={dictionary} />
        <GlowCursor />
      </body>
    </html>
  );
}

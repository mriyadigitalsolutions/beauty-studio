import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Bodoni_Moda, Cormorant_Garamond, Inter } from 'next/font/google';
import '../globals.css';
import { SiteHeader } from '@/components/layout/SiteHeader/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter/SiteFooter';
import { getDictionary } from '@/content';
import { isLocale, locales, type Locale } from '@/content/locales';
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
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: localePath(locale),
      languages: Object.fromEntries(locales.map((code) => [code, localePath(code)])),
    },
    openGraph: {
      type: 'website',
      locale,
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
        <a className="skipLink" href="#main">
          {dictionary.nav.skipToContent}
        </a>
        <SiteHeader locale={locale} dictionary={dictionary} />
        <main id="main">
          <MotionProvider>{children}</MotionProvider>
        </main>
        <SiteFooter locale={locale} dictionary={dictionary} />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalPage } from '@/components/legal/LegalPage';
import { getDictionary } from '@/content';
import { defaultLocale, isLocale, locales } from '@/content/locales';
import { localePath } from '@/lib/i18n';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { legal } = getDictionary(locale);

  return {
    title: legal.datenschutz.title,
    description: legal.datenschutz.lead,
    alternates: {
      canonical: localePath(locale, '/datenschutz'),
      languages: {
        ...Object.fromEntries(locales.map((code) => [code, localePath(code, '/datenschutz')])),
        'x-default': localePath(defaultLocale, '/datenschutz'),
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function DatenschutzPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <LegalPage id="datenschutz" locale={locale} dictionary={getDictionary(locale)} />;
}

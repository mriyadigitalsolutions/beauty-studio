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
    title: legal.impressum.title,
    description: legal.impressum.lead,
    alternates: {
      canonical: localePath(locale, '/impressum'),
      languages: {
        ...Object.fromEntries(locales.map((code) => [code, localePath(code, '/impressum')])),
        'x-default': localePath(defaultLocale, '/impressum'),
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <LegalPage id="impressum" locale={locale} dictionary={getDictionary(locale)} />;
}

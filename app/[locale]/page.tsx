import { HeroSection } from '@/components/HeroSection/HeroSection';
import { LaserReveal } from '@/components/LaserReveal/LaserReveal';
import { SkinLayers } from '@/components/SkinLayers/SkinLayers';
import { HowItWorks } from '@/components/HowItWorks/HowItWorks';
import { Benefits } from '@/components/Benefits/Benefits';
import { Stats } from '@/components/Stats/Stats';
import { CTA } from '@/components/CTA/CTA';
import { getDictionary } from '@/content';
import { isLocale } from '@/content/locales';
import { notFound } from 'next/navigation';

/**
 * The one page of the site. Sections follow the order of specification §4:
 * Hero → Laser Reveal → Skin Layers → How It Works → Benefits → Stats → CTA.
 * Later tickets fill in their own component folder and never touch this file.
 */
export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);

  return (
    <>
      <HeroSection dictionary={dictionary} />
      <LaserReveal dictionary={dictionary} />
      <SkinLayers dictionary={dictionary} />
      <HowItWorks dictionary={dictionary} />
      <Benefits dictionary={dictionary} />
      <Stats dictionary={dictionary} />
      <CTA dictionary={dictionary} />
    </>
  );
}

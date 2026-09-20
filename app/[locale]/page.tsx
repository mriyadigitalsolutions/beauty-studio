import { HeroSection } from '@/components/HeroSection/HeroSection';
import { LaserReveal } from '@/components/LaserReveal/LaserReveal';
import { SkinLayers } from '@/components/SkinLayers/SkinLayers';
import { HowItWorks } from '@/components/HowItWorks/HowItWorks';
import { Benefits } from '@/components/Benefits/Benefits';
import { Prices } from '@/components/Prices/Prices';
import { Stats } from '@/components/Stats/Stats';
import { CTA } from '@/components/CTA/CTA';
import { getDictionary } from '@/content';
import { isLocale } from '@/content/locales';
import { notFound } from 'next/navigation';

/**
 * The one page of the site. Sections follow the order of specification §4:
 * Hero → Laser Reveal → Skin Layers → How It Works → Benefits → Prices →
 * Stats → CTA. Benefits and Prices are the two halves of step 9 and register
 * under the same scene id; the order of the film is this markup, not the order
 * in which they register. Every section is listed here and nowhere else.
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
      <Prices dictionary={dictionary} />
      <Stats dictionary={dictionary} />
      <CTA dictionary={dictionary} />
    </>
  );
}

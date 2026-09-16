import de from './de.json';
import en from './en.json';
import ru from './ru.json';
import type { Dictionary } from './dictionary';
import { defaultLocale, isLocale, locales, type Locale } from './locales';

/**
 * Typing each file as `Dictionary` is what makes a missing translation a build
 * error: `tsc` refuses a json file that does not have every key of the type.
 */
const dictionaries: Record<Locale, Dictionary> = { de, en, ru };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export { defaultLocale, isLocale, locales };
export type { Dictionary, Locale };
export type { HeroText, SectionText } from './dictionary';

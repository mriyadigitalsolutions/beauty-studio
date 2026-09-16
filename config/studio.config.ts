/**
 * The single place where facts about the studio live.
 *
 * Every field below is a PLACEHOLDER until the owner replaces it. A placeholder
 * looks like `[ТЕЛЕФОН]`: the site shows it in a muted style with
 * `data-placeholder`, so an unfilled field is visible as unfilled rather than
 * silently wrong. An invented phone number is worse than an empty one.
 *
 * Lists (`prices`, `stats`, `socials`) start empty or as placeholders: a block
 * with nothing in it hides completely instead of showing an empty frame.
 *
 * Run `npm run check:config` to see what is still missing.
 */

export interface PriceZone {
  /** Stable id, used as a React key. */
  id: string;
  /** Zone name per locale, e.g. { de: 'Achseln', en: 'Underarms', ru: 'Подмышки' }. */
  zone: Record<'de' | 'en' | 'ru', string>;
  /** Price for one session, in minor-unit-free numbers, e.g. 49. */
  price: number;
}

export interface StatItem {
  id: string;
  /** Caption per locale, e.g. { de: 'Jahre Erfahrung', ... }. */
  label: Record<'de' | 'en' | 'ru', string>;
  value: number;
  /** Optional suffix shown after the number, e.g. '+' or '%'. */
  suffix?: string;
}

export interface StudioConfig {
  name: string;
  /** One or two letters for the header monogram. */
  monogram: string;
  phone: string;
  email: string;
  /** Booking widget (Booksy or similar). Falls back to the phone when unfilled. */
  bookingUrl: string;
  address: { street: string; city: string; country: string };
  hours: string;
  messengers: { whatsapp: string; telegram: string };
  socials: { instagram: string; tiktok: string; facebook: string };
  /** ISO 4217 code used to format every price, e.g. 'EUR'. */
  currency: string;
  prices: PriceZone[];
  stats: StatItem[];
  legal: {
    entity: string;
    registration: string;
    responsible: string;
    vatId: string;
  };
}

export const studio: StudioConfig = {
  name: '[НАЗВАНИЕ СТУДИИ]',
  monogram: '[М]',
  phone: '[ТЕЛЕФОН]',
  email: '[EMAIL]',
  bookingUrl: '[ССЫЛКА НА ЗАПИСЬ]',
  address: {
    street: '[УЛИЦА, ДОМ]',
    city: '[ГОРОД, ИНДЕКС]',
    country: '[СТРАНА]',
  },
  hours: '[ЧАСЫ РАБОТЫ]',
  messengers: {
    whatsapp: '[ССЫЛКА WHATSAPP]',
    telegram: '[ССЫЛКА TELEGRAM]',
  },
  socials: {
    instagram: '[ССЫЛКА INSTAGRAM]',
    tiktok: '[ССЫЛКА TIKTOK]',
    facebook: '[ССЫЛКА FACEBOOK]',
  },
  currency: '[ВАЛЮТА]',
  // Zones and prices — fill in, e.g.
  // { id: 'underarms', zone: { de: 'Achseln', en: 'Underarms', ru: 'Подмышки' }, price: 49 }
  prices: [],
  // Counters — fill in, e.g.
  // { id: 'years', label: { de: 'Jahre', en: 'Years', ru: 'Лет' }, value: 8 }
  stats: [],
  legal: {
    entity: '[ЮРИДИЧЕСКОЕ ЛИЦО]',
    registration: '[РЕГИСТРАЦИОННЫЕ ДАННЫЕ]',
    responsible: '[ОТВЕТСТВЕННОЕ ЛИЦО]',
    vatId: '[НАЛОГОВЫЙ НОМЕР]',
  },
};

/** A field the owner has not filled in yet: the whole value is `[...]`. */
export function isPlaceholder(value: string): boolean {
  return /^\[[^[\]]+\]$/.test(value.trim());
}

/** True only for something the owner actually typed. */
export function hasValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && !isPlaceholder(trimmed);
}

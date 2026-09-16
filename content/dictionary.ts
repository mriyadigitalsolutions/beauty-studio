/**
 * The shape every language file must have.
 *
 * `de.json`, `en.json` and `ru.json` are all assigned to this type in
 * `content/index.ts`, so a key missing from any one of them fails `tsc`
 * (and therefore `npm run build`) — untranslated copy is caught before
 * publishing, not after.
 *
 * Sections are pre-declared one per section of the site. Later tickets add
 * keys inside their own section and extend the type here, in all three files
 * at once.
 */

/** Default shape of a section: small label, headline, one paragraph. */
export interface SectionText {
  eyebrow: string;
  title: string;
  lead: string;
}

export interface HeroText {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  lead: string;
  scrollCta: string;
}

export interface Dictionary {
  meta: {
    title: string;
    description: string;
    ogAlt: string;
  };
  nav: {
    menu: string;
    menuClose: string;
    languageLabel: string;
    call: string;
    book: string;
    /** Shown instead of a dead link when neither booking url nor phone is set. */
    bookUnavailable: string;
    skipToContent: string;
    items: {
      hero: string;
      laserReveal: string;
      skinLayers: string;
      howItWorks: string;
      benefits: string;
      prices: string;
      stats: string;
      cta: string;
    };
  };
  sections: {
    hero: HeroText;
    laserReveal: SectionText;
    skinLayers: SectionText;
    howItWorks: SectionText;
    benefits: SectionText;
    prices: SectionText;
    stats: SectionText;
    cta: SectionText;
  };
  footer: {
    contactLabel: string;
    addressLabel: string;
    hoursLabel: string;
    socialLabel: string;
    impressum: string;
    datenschutz: string;
    rights: string;
    /** Screen-reader hint attached to every unfilled placeholder. */
    placeholderNote: string;
  };
  legal: {
    impressum: { title: string; lead: string; pending: string };
    datenschutz: { title: string; lead: string; pending: string };
  };
}

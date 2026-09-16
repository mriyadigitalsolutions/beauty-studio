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

/** Laser Reveal adds the copy its photo layers need (ticket 04). */
export interface LaserRevealText extends SectionText {
  /** Alt text of the before/after photograph. */
  photoAlt: string;
  /** Caption of the untreated half. */
  beforeLabel: string;
  /** Caption of the treated half. */
  afterLabel: string;
  /** Shown instead of the photo when it could not be loaded (R04.2). */
  photoUnavailable: string;
}

/**
 * The first screen carries exactly what the reference shows (§14): two lines
 * of headline, one line of grotesque under them, one pill below. There is no
 * eyebrow and no lead paragraph on it, so there is nothing here to translate
 * that would never appear.
 */
export interface HeroText {
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  scrollCta: string;
}

/** One numbered step of "how it goes" (section How It Works). */
export interface StepText {
  title: string;
  text: string;
}

export interface SkinLayerName {
  epidermis: string;
  dermis: string;
  subcutis: string;
  follicle: string;
}

export interface SkinLayersText extends SectionText {
  /** Labels drawn next to the layers of the cross-section. */
  layers: SkinLayerName;
  /** One sentence per layer, read under the drawing. */
  layerNotes: SkinLayerName;
  beam: string;
  caption: string;
}

export interface HowItWorksText extends SectionText {
  /** Word in front of the number, for screen readers: "Step 2". */
  stepLabel: string;
  steps: StepText[];
}

/** One advantage of the laser, with the line it is compared against. */
export interface BenefitText {
  title: string;
  text: string;
  wax: string;
}

export interface BenefitsText extends SectionText {
  laserLabel: string;
  waxLabel: string;
  items: BenefitText[];
}

export interface PricesText extends SectionText {
  zoneColumn: string;
  priceColumn: string;
  perSession: string;
}

export interface StatsText extends SectionText {
  /** Caption of a counter the owner has not filled in — never a made-up number. */
  pending: string;
  pendingNote: string;
}

export interface CtaText extends SectionText {
  book: string;
  call: string;
  /** Label of the button when there is nothing to link to, and why (story 45). */
  unavailable: string;
  unavailableNote: string;
  contactLabel: string;
  messengers: {
    whatsapp: string;
    telegram: string;
  };
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
    laserReveal: LaserRevealText;
    skinLayers: SkinLayersText;
    howItWorks: HowItWorksText;
    benefits: BenefitsText;
    prices: PricesText;
    stats: StatsText;
    cta: CtaText;
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

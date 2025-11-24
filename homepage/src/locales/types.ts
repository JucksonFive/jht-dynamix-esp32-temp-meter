// Shared locale schema for all language files.
// Keep keys aligned across locales; add optional modifiers only when a language omits a section intentionally.

export interface LocaleAction {
  label: string;
  href: string;
  icon?: string;
}

export interface LocaleStatBlock {
  title: string;
  value: string;
}

export interface FeatureItem {
  title: string;
  desc: string;
  icon: string;
}

export interface FooterColumns {
  product: { title: string };
  company: { title: string; about: string; blog: string };
  support: { title: string };
}

export interface LocaleSchema {
  app: {
    name: string;
    nav: {
      features: string;
      dashboard: string;
    };
    hero: {
      title: string;
      tagline: string;
      ctaFeatures: string;
      ctaDashboard: string;
      headline: {
        line1: string;
        line2: string;
        highlight: string;
      };
      actions: LocaleAction[];
      statBlocks: LocaleStatBlock[];
    };
    features: {
      heading: string;
      list: FeatureItem[];
    };
    footer: {
      intro: {
        tagline: string;
        description: string;
        ctaLabel: string;
        ctaHref: string;
      };
      columns: FooterColumns;
      contact: {
        emailLabel: string;
        phoneLabel: string;
        addressLabel: string;
        availability: string;
        email: string;
        phone: string;
        address: string;
      };
      copyright: (year: number) => string;
    };
    lang: {
      fi: string;
      en: string;
      switch: string;
    };
  };
}

export type Locale = LocaleSchema;

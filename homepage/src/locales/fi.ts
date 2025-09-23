export const fi = {
  app: {
    name: "JT-DYNAMIX",
    nav: {
      features: "Ominaisuudet",
      dashboard: "Dashboard",
      docs: "Dokumentaatio",
      privacy: "Tietosuoja",
    },
    hero: {
      title: "JT-DYNAMIX",
      tagline:
        "Älykäs IoT-alusta lämpötilan, laitteiden ja ympäristön seurantaan. Nopeasti käyttöönotettava, turvallinen ja laajennettava.",
      ctaFeatures: "Tutustu ominaisuuksiin",
      ctaDashboard: "Avaa Dashboard",
      headline: {
        line1: "Kaikki testaus-",
        line2: "ja seuranta tarpeesi",
        highlight: "yhdellä alustalla",
      },
      actions: [
        { label: "Katso demo", href: "#demo", icon: "▶" },
        { label: "Dokumentaatio", href: "#docs", icon: "📘" },
        { label: "GitHub", href: "https://github.com", icon: "💻" },
      ],
      statBlocks: [
        { title: "Laitteita", value: "24" },
        { title: "Lukemia / pv", value: "18k" },
        { title: "Viive", value: "<1s" },
      ],
    },
    features: {
      heading: "Keskeiset ominaisuudet",
      list: [
        {
          title: "Reaaliaikainen seuranta",
          desc: "Lämpötila- ja mittausdata päivittyy sekunneissa – päätöksenteko nopeutuu.",
          icon: "🔥",
        },
        {
          title: "Turvallinen ja hallittu",
          desc: "Laitekohtaiset avaimet, käyttöoikeuksien hallinta ja suojattu tiedonsiirto.",
          icon: "🔐",
        },
        {
          title: "Laajennettava arkkitehtuuri",
          desc: "Pilvipohjainen AWS-infra mahdollistaa skaalautuvuuden ja integraatiot.",
          icon: "⚙️",
        },
        {
          title: "Historia & analytiikka",
          desc: "Rajapinnat ja visualisoinnit pitkän aikavälin seurantaan ja trendeihin.",
          icon: "📈",
        },
      ],
    },
    footer: {
      copyright: (year: number) =>
        `© ${year} JT-DYNAMIX. Kaikki oikeudet pidätetään.`,
    },
    lang: {
      fi: "Suomi",
      en: "English",
      switch: "Kieli",
    },
  },
} as const;

export type FiLocale = typeof fi;

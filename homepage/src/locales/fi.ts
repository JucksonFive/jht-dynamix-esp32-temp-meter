export const fi = {
  app: {
    name: "JT-DYNAMIX",
    nav: {
      features: "Ominaisuudet",
      dashboard: "Dashboard",
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
          icon: "shield",
        },
        {
          title: "Turvallinen ja hallittu",
          desc: "Laitekohtaiset avaimet, käyttöoikeuksien hallinta ja suojattu tiedonsiirto.",
          icon: "lock",
        },
        {
          title: "Laajennettava arkkitehtuuri",
          desc: "Pilvipohjainen AWS-infra mahdollistaa skaalautuvuuden ja integraatiot.",
          icon: "cog",
        },
        {
          title: "Historia & analytiikka",
          desc: "Rajapinnat ja visualisoinnit pitkän aikavälin seurantaan ja trendeihin.",
          icon: "chart",
        },
      ],
    },
    footer: {
      intro: {
        tagline: "Lämpötilatiedon hallintaa modernille tuotannolle.",
        description:
          "Valvo laitteita, lämpötiloja ja hälytyksiä yhdestä turvallisesta ohjauspaneelista AWS-alustan päällä.",
        ctaLabel: "Ota yhteyttä",
        ctaHref: "mailto:info@jt-dynamix.com",
      },
      columns: {
        product: {
          title: "Tuote",
        },
        company: {
          title: "Yritys",
          about: "Yrityksestä",
          blog: "Ajankohtaista",
        },
        support: {
          title: "Tuki",
        },
      },
      contact: {
        emailLabel: "Sähköposti",
        phoneLabel: "Puhelin",
        addressLabel: "Toimisto",
        availability: "Ma–Pe 8:00–16:00 (EET)",
        email: "info@jt-dynamix.com",
        phone: "+358 10 123 4567",
        address: "Helsinki, Suomi",
      },
      social: {
        title: "Seuraa meitä",
        linkedin: "LinkedIn",
        linkedinUrl: "https://www.linkedin.com/company/jt-dynamix",
        github: "GitHub",
        githubUrl: "https://github.com/Hizaguru/jht-dynamix-esp32-temp-meter",
      },
      madeIn: "Rakkaudella tehty Suomessa",
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

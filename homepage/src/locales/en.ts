export const en = {
  app: {
    name: "JT-DYNAMIX",
    nav: {
      features: "Features",
      dashboard: "Dashboard",
      docs: "Documentation",
      privacy: "Privacy",
    },
    hero: {
      title: "JT-DYNAMIX",
      tagline:
        "Smart IoT platform for monitoring temperature, devices and environment. Fast to deploy, secure and extensible.",
      ctaFeatures: "Explore features",
      ctaDashboard: "Open Dashboard",
    },
    features: {
      heading: "Key Features",
      list: [
        {
          title: "Real-time monitoring",
          desc: "Temperature and measurement data updates in seconds – faster decisions.",
          icon: "🔥",
        },
        {
          title: "Secure and controlled",
          desc: "Per-device keys, access control and protected data transfer.",
          icon: "🔐",
        },
        {
          title: "Extensible architecture",
          desc: "Cloud-based AWS infra enables scalability and integrations.",
          icon: "⚙️",
        },
        {
          title: "History & analytics",
          desc: "APIs and visualizations for long term tracking and trends.",
          icon: "📈",
        },
      ],
    },
    footer: {
      copyright: (year: number) => `© ${year} JT-DYNAMIX. All rights reserved.`,
    },
    lang: {
      fi: "Suomi",
      en: "English",
      switch: "Language",
    },
  },
} as const;

export type EnLocale = typeof en;

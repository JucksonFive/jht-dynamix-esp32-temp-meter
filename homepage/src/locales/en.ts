import { LocaleSchema } from "./types";

export const en: LocaleSchema = {
  app: {
    name: "JT-DYNAMIX",
    nav: {
      features: "Features",
      dashboard: "Dynlink Dashboard",
    },
    hero: {
      title: "JT-DYNAMIX",
      tagline:
        "Smart IoT platform for monitoring temperature, devices and environment. Fast to deploy, secure and extensible.",
      ctaFeatures: "Explore features",
      ctaDashboard: "Open Dynlink Dashboard",
      headline: {
        line1: "All Your Device",
        line2: "Monitoring Needs in a",
        highlight: "Simple Platform",
      },
      actions: [
        { label: "Watch Demo", href: "#demo", icon: "▶" },
        { label: "Docs", href: "#docs", icon: "📘" },
        { label: "GitHub", href: "https://github.com", icon: "💻" },
      ],
      statBlocks: [
        { title: "Devices", value: "24" },
        { title: "Readings / day", value: "18k" },
        { title: "Latency", value: "<1s" },
      ],
    },
    features: {
      heading: "Key Features",
      list: [
        {
          title: "Real-time monitoring",
          desc: "Temperature and measurement data updates in seconds – faster decisions.",
          icon: "shield",
        },
        {
          title: "Secure and controlled",
          desc: "Per-device keys, access control and protected data transfer.",
          icon: "lock",
        },
        {
          title: "Extensible architecture",
          desc: "Cloud-based AWS infra enables scalability and integrations.",
          icon: "cog",
        },
        {
          title: "History & analytics",
          desc: "APIs and visualizations for long term tracking and trends.",
          icon: "chart",
        },
      ],
    },
    footer: {
      intro: {
        tagline: "Connected thermal intelligence for modern operations.",
        description:
          "Monitor devices, temperatures and alerts from a single secure command center built on AWS.",
        ctaLabel: "Talk to our team",
        ctaHref: "mailto:info@jt-dynamix.com",
      },
      columns: {
        product: {
          title: "Product",
        },
        company: {
          title: "Company",
          about: "About us",
          blog: "Updates",
        },
        support: {
          title: "Support",
        },
      },
      contact: {
        emailLabel: "Email",
        phoneLabel: "Phone",
        addressLabel: "Office",
        availability: "Mon–Fri 8:00–16:00 (EET)",
        email: "info@jt-dynamix.com",
        phone: "+358 10 123 4567",
        address: "Helsinki, Finland",
      },

      copyright: (year: number) => `© ${year} JT-DYNAMIX. All rights reserved.`,
    },
    lang: {
      fi: "Suomi",
      en: "English",
      switch: "Language",
    },
  },
} as const;

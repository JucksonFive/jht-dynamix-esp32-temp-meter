import React from "react";
import { useI18n } from "../locales/I18nProvider";
import { MediaCarousel } from "./MediaCarousel";

export const Hero: React.FC = () => {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden min-h-[80vh] md:min-h-[92vh] flex items-stretch">
      <MediaCarousel background className="absolute inset-0" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/0"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-grid opacity-[0.05] mix-blend-overlay"
      />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 flex items-center">
        <div className="max-w-xl md:max-w-2xl py-28 md:py-40">
          <h1 className="font-semibold text-white tracking-tight leading-[1.05] text-[clamp(2.5rem,6vw+0.5rem,4.75rem)]">
            <span className="block">{t.app.hero.headline?.line1}</span>

            <span className="block mt-2">
              {t.app.hero.headline.line2}
              <span className="text-white">
                {t.app.hero.headline.highlight}
              </span>
            </span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-white/85 max-w-2xl">
            {t.app.hero.tagline}
          </p>
          <div className="mt-10 flex gap-4">
            <a
              href="#ominaisuudet"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 text-white px-8 py-3 text-sm font-medium hover:bg-white/10 backdrop-blur-sm transition focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              {t.app.hero.ctaFeatures}
            </a>
            <a
              href="https://app.jt-dynamix.com"
              className="inline-flex items-center gap-2 rounded-full bg-white text-gray-900 px-8 py-3 text-sm font-semibold shadow-sm hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              {t.app.hero.ctaDashboard}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

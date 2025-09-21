import React from "react";
import { useI18n } from "../locales/I18nProvider";
import { MediaCarousel } from "./MediaCarousel";

export const Hero: React.FC = () => {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden h-[70vh] min-h-[560px] flex items-stretch bg-white">
      {/* Background slider */}
      <MediaCarousel background className="pointer-events-none opacity-40" />
      {/* Overlay gradients for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white/70 to-white/30" />
      <div className="absolute inset-0 bg-grid opacity-30 mix-blend-multiply" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col justify-center w-full">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight gradient-brand">
            {t.app.hero.title}
          </h1>
          <p className="mt-8 text-lg md:text-xl text-gray-600 leading-relaxed">
            {t.app.hero.tagline}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a
              href="#ominaisuudet"
              className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-8 py-3 text-sm font-semibold text-white shadow focus:ring-2 focus:ring-brand-primary/40 focus:outline-none hover:bg-brand-primary/90 transition"
            >
              {t.app.hero.ctaFeatures}
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition"
            >
              {t.app.hero.ctaDashboard}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

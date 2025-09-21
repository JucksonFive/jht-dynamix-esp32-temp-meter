import React from "react";
import { useI18n } from "../locales/I18nProvider";
import { MediaCarousel } from "./MediaCarousel";

export const Hero: React.FC = () => {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden h-[70vh] min-h-[560px] flex items-stretch">
      {/* Background slider */}
      <MediaCarousel background className="pointer-events-none" />
      {/* Overlay gradients for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-midnight-900/90 via-midnight-900/60 to-midnight-900/30" />
      <div className="absolute inset-0 bg-gradient-dashboard opacity-60 mix-blend-screen" />
      <div className="absolute inset-0 bg-grid opacity-40" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col justify-center w-full">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight gradient-text drop-shadow-sm">
            {t.app.hero.title}
          </h1>
          <p className="mt-8 text-lg md:text-xl text-gray-300 leading-relaxed">
            {t.app.hero.tagline}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a
              href="#ominaisuudet"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan px-8 py-3 text-sm font-semibold text-white shadow-glow-purple hover:opacity-90 transition"
            >
              {t.app.hero.ctaFeatures}
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-semibold bg-midnight-800/70 backdrop-blur border border-white/10 hover:border-neon-purple/40 text-gray-200 transition"
            >
              {t.app.hero.ctaDashboard}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

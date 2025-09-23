import React from "react";
import { useI18n } from "../locales/I18nProvider";
import { MediaCarousel } from "./MediaCarousel";

// Hero ilman erillistä mediaboksia: karuselli taustalla koko alueella.
export const Hero: React.FC = () => {
  const { t } = useI18n();

  // Safely read new headline parts (fallback to legacy title if not present)
  const line1 = t.app.hero.headline?.line1 ?? t.app.hero.title;
  const line2 = t.app.hero.headline?.line2 ?? "";
  const highlight = t.app.hero.headline?.highlight ?? "";

  return (
    <section className="relative overflow-hidden">
      {/* Vaalea taustakerros */}
      <div className="absolute inset-0 bg-hero-light" />
      {/* Hento karuselli vaalealla (alempi opasiteetti) */}
      <MediaCarousel background className="opacity-25 mix-blend-multiply" />
      {/* Kevyt ruudukko */}
      <div className="absolute inset-0 bg-grid opacity-[0.04]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32 flex flex-col">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            <span className="block">{line1}</span>
            {line2 && (
              <span className="block mt-2">
                {line2}{" "}
                {highlight && (
                  <span className="text-gray-900">{highlight}</span>
                )}
              </span>
            )}
          </h1>
          <p className="mt-8 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl">
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

          {/* Stat-kortit rivissä CTA:iden jälkeen */}
          {t.app.hero.statBlocks && (
            <div className="mt-12 flex flex-wrap gap-4">
              {t.app.hero.statBlocks.slice(0, 3).map((s: any) => (
                <div
                  key={s.title}
                  className="min-w-[9rem] rounded-xl bg-white/70 backdrop-blur-sm border border-gray-200 px-4 py-4 text-xs text-gray-600 flex flex-col gap-1 shadow-sm"
                >
                  <span className="font-semibold text-gray-700 tracking-wide text-[0.65rem] uppercase">
                    {s.title}
                  </span>
                  <span className="text-brand-primary text-base font-bold">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

import React from "react";
import { useI18n } from "../locales/I18nProvider";
import { MediaCarousel } from "./MediaCarousel";

// A refactored Hero inspired by a two-column SaaS marketing layout.
export const Hero: React.FC = () => {
  const { t } = useI18n();

  // Safely read new headline parts (fallback to legacy title if not present)
  const line1 = t.app.hero.headline?.line1 ?? t.app.hero.title;
  const line2 = t.app.hero.headline?.line2 ?? "";
  const highlight = t.app.hero.headline?.highlight ?? "";

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dashboard" />
      <div className="absolute inset-0 opacity-[0.08] bg-grid" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-primary/30 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-0 -right-40 w-[32rem] h-[32rem] rounded-full bg-neon-pink/20 blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-28 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Textual content */}
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              <span className="block">{line1}</span>
              {line2 && (
                <span className="block mt-2">
                  {line2}{" "}
                  {highlight && (
                    <span className="bg-gradient-to-r from-brand-primary via-neon-pink to-brand-accent text-transparent bg-clip-text">
                      {highlight}
                    </span>
                  )}
                </span>
              )}
            </h1>
            <p className="mt-8 text-lg md:text-xl text-gray-300 max-w-xl leading-relaxed">
              {t.app.hero.tagline}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a
                href="#ominaisuudet"
                className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-8 py-3 text-sm font-semibold text-white shadow-glow-purple focus:ring-2 focus:ring-brand-primary/40 focus:outline-none hover:bg-brand-primary/90 transition"
              >
                {t.app.hero.ctaFeatures}
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-semibold bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition"
              >
                {t.app.hero.ctaDashboard}
              </a>
            </div>

            {/* Quick actions (optional small cards) */}
            {t.app.hero.actions && (
              <div className="mt-12 flex flex-wrap gap-4">
                {t.app.hero.actions.map((a: any) => (
                  <a
                    key={a.label}
                    href={a.href}
                    className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/80 hover:text-white transition"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-primary/20 text-brand-primary font-medium group-hover:bg-brand-primary/30">
                      {a.icon}
                    </span>
                    <span className="font-medium">{a.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Media / visual */}
          <div className="relative w-full">
            <div className="relative aspect-[5/4] md:aspect-[4/3] rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-brand-primary/20 bg-white/5 backdrop-blur">
              <MediaCarousel className="w-full h-full" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-brand-dark/40 via-transparent to-brand-accent/10 mix-blend-overlay" />
            </div>
            {/* Decorative bottom bar mimicking stats / status placeholders */}
            <div className="absolute -bottom-6 left-6 right-6 grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/10 backdrop-blur border border-white/10 px-4 py-3 text-xs text-white/70 flex flex-col gap-1"
                >
                  <span className="font-semibold text-white/90 tracking-wide">
                    {t.app.hero.statBlocks?.[i]?.title ?? "Metric"}
                  </span>
                  <span className="text-brand-primary text-sm font-bold">
                    {t.app.hero.statBlocks?.[i]?.value ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

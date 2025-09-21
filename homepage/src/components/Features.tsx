import React from "react";
import { useI18n } from "../locales/I18nProvider";

export const Features: React.FC = () => {
  const { t } = useI18n();
  const featureData = t.app.features.list;
  return (
    <section id="ominaisuudet" className="relative py-24">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-midnight-800/30 to-transparent" />
      <div className="relative max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-12 text-center">
          {t.app.features.heading}
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {featureData.map((f) => (
            <div key={f.title} className="card-glow flex flex-col items-start">
              <div className="text-3xl mb-4" aria-hidden>
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

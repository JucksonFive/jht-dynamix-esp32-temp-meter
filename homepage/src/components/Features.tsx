import React from "react";
import { useI18n } from "../locales/I18nProvider";
import { FeatureCard } from "./FeatureCard";

export const Features: React.FC = () => {
  const { t } = useI18n();
  const featureData = t.app.features.list;
  return (
    <section id="ominaisuudet" className="relative py-24 bg-white">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-gray-50 to-transparent" />
      <div className="relative max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
          {t.app.features.heading}
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {featureData.map((f) => (
            <FeatureCard
              key={f.title}
              title={f.title}
              desc={f.desc}
              icon={f.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

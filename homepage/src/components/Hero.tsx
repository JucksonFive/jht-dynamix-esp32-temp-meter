import React from "react";

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-28 pb-24">
      <div className="absolute inset-0 bg-gradient-dashboard opacity-60" />
      <div className="absolute inset-0 bg-grid mix-blend-overlay" />
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight gradient-text drop-shadow-sm">
            JT-DYNAMIX
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Älykäs IoT-alusta lämpötilan, laitteiden ja ympäristön seurantaan.
            Nopeasti käyttöönotettava, turvallinen ja laajennettava.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#ominaisuudet"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan px-8 py-3 text-sm font-semibold text-white shadow-glow-purple hover:opacity-90 transition"
            >
              Tutustu ominaisuuksiin
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-semibold bg-midnight-800/70 backdrop-blur border border-white/10 hover:border-neon-purple/40 text-gray-200 transition"
            >
              Avaa Dashboard
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

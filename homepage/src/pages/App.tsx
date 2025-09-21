import React from "react";
import { Features } from "../components/Features";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { I18nProvider, useI18n } from "../locales/I18nProvider";

const LanguageSwitcher: React.FC = () => {
  const { lang, toggle, t } = useI18n();
  return (
    <button
      onClick={toggle}
      className="text-xs font-medium px-3 py-2 rounded-lg border border-white/10 hover:border-neon-purple/40 bg-midnight-800/60 backdrop-blur text-gray-300 hover:text-white transition"
      aria-label={t.app.lang.switch}
    >
      {lang === "fi" ? t.app.lang.en : t.app.lang.fi}
    </button>
  );
};

const Shell: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col bg-midnight-900 text-gray-100">
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur bg-midnight-900/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            className="font-extrabold text-lg tracking-wider gradient-text"
          >
            {t.app.name}
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a
              href="#ominaisuudet"
              className="text-gray-300 hover:text-white transition"
            >
              {t.app.nav.features}
            </a>
            <a
              href="/dashboard"
              className="text-gray-300 hover:text-white transition"
            >
              {t.app.nav.dashboard}
            </a>
            <a
              href="/docs"
              className="text-gray-300 hover:text-white transition"
            >
              {t.app.nav.docs}
            </a>
            <a
              href="/tietosuoja"
              className="text-gray-300 hover:text-white transition"
            >
              {t.app.nav.privacy}
            </a>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => (
  <I18nProvider>
    <Shell />
  </I18nProvider>
);

export default App;

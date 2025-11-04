import React from "react";
import { Features } from "../components/Features";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { I18nProvider, useI18n } from "../locales/I18nProvider";

const LanguageSwitcher: React.FC = () => {
  const { lang, toggle, t } = useI18n();
  const nextLang = lang === "fi" ? "en" : "fi";
  const flag = lang === "fi" ? "🇫🇮" : "🇬🇧"; // current language flag
  const nextFlag = nextLang === "fi" ? "🇫🇮" : "🇬🇧"; // flag shown as target (optional)
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border border-gray-300 hover:border-brand-primary bg-white text-body hover:text-heading shadow-sm transition"
      aria-label={t.app.lang.switch}
      title={t.app.lang.switch}
    >
      <span aria-hidden className="text-base leading-none">
        {flag}
      </span>
      <span className="hidden sm:inline">
        {lang === "fi" ? t.app.lang.fi : t.app.lang.en}
      </span>
      <span aria-hidden className="text-[10px] opacity-60 hidden sm:inline">
        →
      </span>
      <span aria-hidden className="text-base leading-none hidden sm:inline">
        {nextFlag}
      </span>
    </button>
  );
};

const Shell: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur bg-white/80 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center group"
            aria-label={t.app.name}
          >
            <img
              src="/jt-dynamix-logo.svg"
              alt="JT-DYNAMIX"
              className="h-8 w-auto select-none transition-opacity group-hover:opacity-90"
              draggable={false}
            />
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a
              href="#ominaisuudet"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              {t.app.nav.features}
            </a>
            <a
              href="https://app.jt-dynamix.com/"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              {t.app.nav.dashboard}
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

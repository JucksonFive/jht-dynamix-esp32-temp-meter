import React from "react";
import { Features } from "../components/Features";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-midnight-900 text-gray-100">
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur bg-midnight-900/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            className="font-extrabold text-lg tracking-wider gradient-text"
          >
            JT-DYNAMIX
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a
              href="#ominaisuudet"
              className="text-gray-300 hover:text-white transition"
            >
              Ominaisuudet
            </a>
            <a
              href="/dashboard"
              className="text-gray-300 hover:text-white transition"
            >
              Dashboard
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition">
              Dokumentaatio
            </a>
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

export default App;

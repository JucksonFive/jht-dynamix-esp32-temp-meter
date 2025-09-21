import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="relative py-12 mt-12 border-t border-white/5 bg-midnight-800/40 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-400">
        <p className="order-2 md:order-1">
          © {new Date().getFullYear()} JT-DYNAMIX. Kaikki oikeudet pidätetään.
        </p>
        <nav className="flex gap-6 order-1 md:order-2 text-gray-300">
          <a href="#ominaisuudet" className="hover:text-neon-purple transition">
            Ominaisuudet
          </a>
          <a href="/dashboard" className="hover:text-neon-purple transition">
            Dashboard
          </a>
          <a href="/tietosuoja" className="hover:text-neon-purple transition">
            Tietosuoja
          </a>
        </nav>
      </div>
    </footer>
  );
};

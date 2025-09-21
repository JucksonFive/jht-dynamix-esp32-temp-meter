# JT-DYNAMIX Homepage

Tämä hakemisto sisältää julkisen markkinointi / landing page -sivun, joka noudattaa dashboardin (Tailwind + dark neon) värimaailmaa.

## Kehitys

Asenna riippuvuudet juuren tasolta:

```
pnpm install
```

Käynnistä kehityspalvelin:

```
cd homepage
pnpm dev
```

Avaa selaimessa: http://localhost:5173

## Rakenne

- `index.html` – perusdokumentti (dark mode oletuksena)
- `tailwind.config.js` – jaettu väripaletti (midnight + neon)
- `src/index.css` – globaalit apuluokat (gradient-teksti, grid-tausta, korttityyli)
- `src/pages/App.tsx` – sivun runko ja navigaatio
- `src/components/*` – Hero, Features, Footer

## Design-periaatteet

- Tumma tausta: `midnight-900`
- Korostukset: gradientti `neon-purple -> neon-pink -> neon-cyan`
- Kortit: läpikuultava paneeli + blur + hehkuva reunus hoverissa

## Seuraavat jatkokehitysideat

- Responsiivinen mobiilivalikko (hamburger)
- Asiakastarinoita / referenssiosio
- CTA-lomake (beta-kutsu / yhteydenotto)
- Kieli-vaihto (fi/en)

---

Rakennettu Vite + React + Tailwind.

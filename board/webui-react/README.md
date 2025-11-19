# Web UI React (ESP32 Setup)

Tämä korvaa vanhan staattisen `data/html` sisällön React-pohjaisella versiolla.
Build suuntaa suoraan `board/data/html` kansioon, josta PlatformIO `uploadfs` voi ladata SPIFFS/LittleFS:ään.

## Kehitys

```pwsh
cd board/webui-react
pnpm install
pnpm dev
```

Paikallinen dev-palvelin ei ole ESP32:lla, joten API-pyynnöt (\`/scan-wifi\`, \`/connect-to-wifi\`, \`/link-device\`, \`/complete-setup\`) kannattaa mockata tai käyttää proxyä jos laite on verkossa.

## Build ja deploy laitteelle

```pwsh
cd board/webui-react
pnpm build
cd ..\data\html
# Varmista että favicon.svg ja globe.svg ovat tallella
cd ..\..
# Lataa tiedostojärjestelmään
pio run --target uploadfs
```

## Rakenne
- `src/hooks/useWifiScan.ts` polling logiikka /scan-wifi endpointille
- `WifiStep` WiFi skannaus ja yhdistys
- `CredentialsStep` käyttäjän linkitys laitteeseen
- `ConfirmStep` yhteenveto + /complete-setup kutsu

## Optimointi ESP32:lle
- Vite build minifioi automaattisesti (`esbuild`)
- Ei raskaita riippuvuuksia (vain React + ReactDOM)
- Voit myöhemmin korvata Reactin esim. Preactilla (lisää `preact` ja alias `react` -> `preact/compat`) pienempää bundlakokoa varten.

## Jatkotoimet
- Lisää virhetilojen tarkempi käsittely
- Lisää validaatio syötteisiin
- Toteuta mahdollinen progress-indikaattori laiteuudelleenkäynnistykselle

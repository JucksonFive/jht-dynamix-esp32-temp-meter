Tässä kehitystiketti pyydetyssä muodossa:

## Ticket 1: Ota käyttöön Pre-commit-koukut koodinlaadun automaattiseksi varmistukseksi
Automatisoidaan koodin muotoilu ja linttaus ajamalla ne automaattisesti ennen jokaista `git commit` -komentoa. Tavoitteena on nopeuttaa palautesilmukkaa, yhtenäistää koodin laatua ja vähentää virheitä jo kehitysvaiheessa.

### Tausta
Tällä hetkellä koodin laadunvarmistus (muotoilu, staattinen analyysi) tapahtuu pääasiassa CI/CD-putkessa tai kehittäjän manuaalisesti ajamana. Tämä johtaa tilanteisiin, joissa virheellisesti muotoiltua tai laadultaan heikkoa koodia päätyy versionhallintaan, ja palaute virheestä saadaan vasta putken ajon jälkeen. Tämä hidastaa kehitystä ja aiheuttaa turhia korjaus-commiteja.

### Hyödyt
- **Nopeampi palaute:** Kehittäjä saa välittömän palautteen virheistä omalla koneellaan ennen koodin jakamista.
- **Yhtenäinen koodikanta:** Kaikki commitoitu koodi on automaattisesti samojen muotoilu- ja laatusääntöjen mukaista.
- **Tehokkaampi CI/CD:** Vähentää CI-putken kuormitusta, kun perustason virheet karsitaan pois jo paikallisesti.
- **Parempi kehittäjäkokemus (DevEx):** Poistaa tarpeen muistaa ajaa laadunvarmistustyökaluja manuaalisesti.

### Toteutus
Otetaan käyttöön `pre-commit`-niminen työkalu, joka hallinnoi Git-koukkuja keskitetysti. Luodaan monorepon juureen `.pre-commit-config.yaml`-konfiguraatiotiedosto, jossa määritellään eri tiedostotyypeille ajettavat työkalut:
- **Python (Backend, CDK):** `black` (muotoilu), `ruff` (linttaus)
- **TypeScript/JavaScript (Frontend):** `prettier` (muotoilu), `eslint` (linttaus)
- **Firmware (C/C++):** `clang-format` (muotoilu)
- **Yleiset:** `trailing-whitespace`, `end-of-file-fixer`

### Tehtävät
- [ ] Lisää `pre-commit` projektin kehitysaikaisiin riippuvuuksiin.
- [ ] Luo juurihakemistoon `.pre-commit-config.yaml` -konfiguraatiotiedosto.
- [ ] Määritä konfiguraatioon yleiset koukut (esim. `trailing-whitespace`).
- [ ] Lisää ja konfiguroi Python-spesifit koukut (`black`, `ruff`).
- [ ] Lisää ja konfiguroi TypeScript/JavaScript-spesifit koukut (`prettier`, `eslint`).
- [ ] Aja `pre-commit run --all-files` ja commitoi sen tekemät automaattiset korjaukset olemassa olevaan koodikantaan.
- [ ] Päivitä `README.md` tai kehittäjän dokumentaatio sisältämään ohjeet `pre-commit install` -komennon ajamisesta projektin käyttöönoton yhteydessä.

### Hyväksymiskriteerit
- `git commit` -komennon suorittaminen epämuotoillun tiedoston kanssa epäonnistuu ja näyttää virheen.
- `pre-commit`-koukku korjaa automaattisesti muotoiluvirheet (esim. `black`, `prettier`), jonka jälkeen `git commit` onnistuu.
- Linttausvirhe (jota ei voi automaattisesti korjata) estää commitin ja tulostaa selkeän virheilmoituksen.
- Kehittäjän dokumentaatiossa on selkeät ohjeet koukkujen asentamiseksi paikalliseen ympäristöön.

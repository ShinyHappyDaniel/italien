# Puglia-guide · Ostuni 2026

Interaktiv familjeguide till Ostuni-trakten. Leaflet-karta med klickbara ställen,
filter, sök, ringbara nummer, vägbeskrivning och offline-stöd (PWA).

## Lägg upp på GitHub Pages (~2 min)

1. Gå till github.com → **New repository**. Ge det ett namn, t.ex. `puglia-guide`. Sätt det till **Public**. Klicka **Create repository**.
2. På repo-sidan: **Add file → Upload files**. Dra in **alla filer i den här mappen** (index.html, app.js, data.js, manifest.json, sw.js, icon-180.png, icon-512.png). Klicka **Commit changes**.
3. Gå till **Settings → Pages**. Under *Build and deployment* → *Source*: välj **Deploy from a branch**. Välj branch **main** och mapp **/ (root)**. Klicka **Save**.
4. Vänta ~1 minut. Sidan blir live på:
   `https://DITT-ANVÄNDARNAMN.github.io/puglia-guide/`

Klart. Öppna länken i mobilen och lägg till på hemskärmen (Dela → Lägg till på hemskärmen) för app-känsla + offline.

## Redigera innehåll

All data ligger i **data.js** — platser, koordinater, betyg, telefon, beskrivningar,
nödnummer och regler. Ändra där och ladda upp filen på nytt.

## Teknik
- Leaflet + OpenStreetMap (inga API-nycklar)
- Ren HTML/CSS/JS, inga byggverktyg
- Service worker (sw.js) cachar app + kartrutor för offline
- Mörkt läge följer systemet automatiskt

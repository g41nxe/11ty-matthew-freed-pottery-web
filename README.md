# Matthew Freed Pottery

Website des Töpferstudios von Matthew Freed in Vancouver: [matthewfreed.ca](https://matthewfreed.ca). Der Shop liegt getrennt auf Shopify ([shop.matthewfreed.net](https://shop.matthewfreed.net)).

Matthew pflegt die Inhalte selbst im CMS unter [matthewfreed.ca/admin/](https://matthewfreed.ca/admin/). Dan betreut die Technik.

## Aufbau

| Teil | Technik |
|---|---|
| Seitengenerator | [Eleventy 3](https://www.11ty.dev/), Templates in Nunjucks |
| CMS | [TinaCMS](https://tina.io/) über TinaCloud (seit `v2.1.0`, vorher Decap), siehe ADR 0001 |
| Styles | Tailwind CSS 4 über PostCSS |
| Bilder | `@11ty/eleventy-img` über den Shortcode `{% img %}`: AVIF, WebP und JPG in acht Breiten |
| Hosting | Netlify, Build bei jedem Push auf `main` |
| Formulare | Netlify Forms (Kontaktseite, mit reCAPTCHA) |

```
src/
  views/            Seiten (Markdown mit Front Matter, von Tina gepflegt)
    _data/          Daten: Termine, Galerie, globale Einstellungen, Sold-out-Abfrage
    _includes/      Layouts und Partials
  images/           Medienordner von Tina (Originale, auch unter /images/ ausgeliefert)
  assets/           Favicons, eigene Schriften (Fraunces, Karla)
  javascript/       Browser-Skripte, ausgeliefert unter /js/
  styles/main.css   Tailwind-Einstieg
tina/               Tina-Schema: config.ts, collections/, fields/
scripts/            Hilfsskripte (siehe unten)
test/               Tests mit node:test
docs/               ADRs, Feature-Tickets, Specs und Pläne
_archive/           alte Daten aus der Decap-Zeit
```

Die Filter in `.eleventy.js` sind absichtlich nachsichtig: Fehlt in einem CMS-Eintrag ein Bild, ein Alt-Text oder ein Datum, bricht der Build nicht ab. Der Eintrag fällt weg oder bekommt einen Standardtext, und das Build-Log nennt die Seite.

Fachbegriffe wie Market, Event und Shop set stehen in [`CONTEXT.md`](CONTEXT.md).

## Befehle

Node-Version steht in `.nvmrc`. Zuerst `npm install`.

| Befehl | Zweck |
|---|---|
| `npm run dev` | Tina-Entwicklungsserver plus Eleventy mit Live-Neuladen, Admin unter `/admin/` |
| `npm run build` | Produktions-Build wie auf Netlify, mit Tina-Admin (braucht `TINA_TOKEN`) |
| `npm run build:site` | nur die Website, ohne Tina |
| `npm test` | alle Tests in `test/` |
| `npm run typecheck` | TypeScript-Prüfung des Tina-Schemas |
| `npm run shop:check` | vergleicht die Shop-Artikel der Startseite mit dem Shop, schreibt `reports/shop-check.html` |
| `npm run map:preview` | erzeugt das Kartenbild der Kontaktseite neu aus OpenStreetMap (nach einem Umzug) |
| `npm run tina:roundtrip` | liest ein Tina-Dokument und speichert es zurück; der Inhalt muss gleich bleiben (braucht `npm run dev`) |
| `npm run go-live -- check` | Probelauf des Livegang-Skripts (Skill `tina-livegang`) |

## Umgebungsvariablen

Werden auf Netlify gesetzt, nie ins Repo geschrieben.

| Variable | Wofür |
|---|---|
| `TINA_TOKEN` | Lesezugriff von TinaCloud beim Build |
| `NEXT_PUBLIC_TINA_CLIENT_ID` | TinaCloud-Projekt, hat einen Standardwert in `tina/config.ts` |
| `HEAD` / `GITHUB_BRANCH` | Branch, den Tina bearbeitet. Netlify setzt `HEAD`, lokal gilt `GITHUB_BRANCH` oder `main` |
| `COMMIT_REF` | von Netlify gesetzt, erscheint in `/build.txt` |
| `UMAMI_WEBSITE_ID` | Umami-Messung. Ist auf Netlify schon gesetzt, wird aber erst mit der Messung genutzt (siehe unten) |

## Konventionen

- Commit-Nachrichten auf Deutsch im Format `typ(bereich): …`. Code-Kommentare und Testnamen auf Englisch, Inhalte der Website ebenfalls.
- Commits, die die Website nicht ändern (Doku, Skripte, Tests), bekommen `[skip netlify]`, damit keine Build-Minuten verbraucht werden.
- Keine Dienste von Google beim Seitenaufruf: Schriften kommen von der eigenen Seite, die Karte ist ein Bild mit Link. Ein Test prüft das (`test/no-google-on-load.test.mjs`). reCAPTCHA im Kontaktformular bleibt die einzige Ausnahme (Ticket 0005).
- Größere Entscheidungen werden als ADR unter `docs/adr/` festgehalten, Ideen für später als Ticket unter `docs/feature/`.

## Stand

- **Tina-Migration:** umgeschaltet. Offene Punkte (Medien-Test auf TinaCloud, Matthew einladen, Rückblick nach einer Woche) stehen in der [Checkliste](docs/superpowers/plans/2026-09-17-tina-umstellung-checkliste.md).
- **Ohne Google beim Seitenaufruf** (Ticket 0005): umgesetzt und auf `main`.
- **Messung von Klicks und Verkäufen, in Arbeit** auf dem Branch `feat/klicks-und-verkaeufe`. Die Messung kommt ohne Cookies und ohne Banner aus: Jeder Shop-Link bekommt UTM-Parameter mit seiner Platzierung, dazu zählt Umami Cloud sechs Ereignisse (`firing-shown`, `firing-seen`, `shop-click`, `directions`, `glaze-slider`, `contact-sent`). Der Code ist fertig, aber noch nicht gemergt. Offen sind die Share-URL für Matthew, die Shopify-Kampagne und der Zugang zu Shopify. Design, Plan und ADR 0004 liegen auf dem Branch.

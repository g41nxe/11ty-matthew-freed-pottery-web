# Bildbestand neu ordnen — Design

Datum: 2026-09-12
Status: entschieden (Grilling-Session mit Dan)
Branch: `feat/site-redesign-v2`

## Kontext

`src/images` ist über sechs Jahre gewachsen und trägt 98 Dateien in vier Töpfen:
56 im Wurzelordner, 16 in `updates`, 17 in `features`, 9 in `new`. Davon sind
nur 56 referenziert. Die Namen stammen aus drei Epochen (`carousel-*`,
`feature-*`, `dsc*`, `mvimg_*`) und folgen keinem Schema. Zwei Ordner —
`updates` für News und der Wurzelordner für alles andere — liegen auf derselben
Ebene, ohne dass die Trennung noch etwas bedeutet.

Auslöser ist Matthews Mail vom 2026-09-06: Er hat fünf neue Fotos geschickt, aus
denen bereits zwei Ableitungen in den Bestand eingeflossen sind. Dabei sind
sofort neue Karteileichen entstanden (`carousel-joffre2.jpg`,
`carousel-tofino2.jpg`) — dasselbe Muster, das den Ordner zugemüllt hat.

## Befunde

- **98 Dateien.** 42 davon unreferenziert, zusammen 25 MB. (Stand 2026-09-12,
  nach Commit `d3caa01`.)
- **Drei byte-identische Dubletten:** `carousel-kitsilano2.jpg` und
  `garibaldi-cropped.jpg` liegen je zweimal (Wurzel und `updates`),
  `blue-mug-and-plate.jpg` ist dieselbe Datei wie `carousel-joffre2.jpg`.
- **`updates` ist kein reiner News-Ordner.** `squamish-nights-close.jpg` liefert
  das Hero der Startseite, und bis Commit `25a9864` tat `treeoflife-teaset.jpg`
  dasselbe für das Stück der Woche.
- **Alles wird deployt.** `.eleventy.js:26` kopiert `src/images` vollständig nach
  `dist`, damit Decap Vorschaubilder rendern kann. Die 25 MB Totholz gehen bei
  jedem Build mit.
- **Öffentliche URLs sind nicht betroffen.** Live ausgeliefert werden die
  gehashten Varianten aus dem `{% img %}`-Shortcode. Weder `_redirects` noch
  `seo.json` verweisen auf einen Pfad aus `src/images`.
- **Ausgabedateinamen hängen nicht am Pfad.** `eleventy-img` hasht Dateiinhalt
  und Sharp-Optionen (`node_modules/@11ty/eleventy-img/src/image.js:432`).
  Ein reiner Umzug lässt `dist/images` byte-identisch.

## Einschränkung: Decap kennt keine Ordnernavigation

Die Medienauswahl zeigt genau einen konfigurierten Ordner. Unterordner sind
unsichtbar; der Wunsch ist seit 2020 offen
([decap-cms#3240](https://github.com/decaporg/decap-cms/issues/3240)).
Installiert ist Decap 3.14 über CDN (`src/admin/index.html:11`).

Entschärft wird das durch die Nutzungshistorie:

| Datei | Wer pflegt sie | Letzte Änderung durch Matthew |
|---|---|---|
| `showcase.json` (Galerie, Produkte) | faktisch nur Dan | März 2021, über Forestry |
| `news.json` | Matthew | Februar 2026 |
| `events.json` | Matthew, regelmäßig | Juli 2026, zehn Commits |

Das Galerie-Feld, das von einer zweistufigen Struktur betroffen wäre, benutzt
Matthew seit fünf Jahren nicht.

## Entscheidungen

1. **Gliederung nach Motiv**, in fünf Ordnern: `glazes`, `products`, `news`,
   `workshop`, `site`. Motiv und Verwendungszweck fallen hier fast überall
   zusammen, deshalb bleibt die Struktur CMS-tauglich.
2. **`glazes` ist zweistufig**, ein Unterordner je Glasurlinie. Ordnername ist
   der ausgeschriebene Linienname in Kleinschreibung mit Bindestrich
   (`squamish-nights`, `pemberton-sky`, `tree-of-life`), **nicht** der verkürzte
   `slug` aus `showcase.json`, der ein Shop-Filter ist.
3. **`products` bleibt flach**, Glasur zuerst: `jericho-belly-mug-tile.jpg`.
   Bei sechzehn Dateien wären Unterordner übertrieben.
4. **Bei Motivkonflikt gewinnt die Glasur.** Ein News-Bild, das ein Stück einer
   Linie zeigt, wandert nach `glazes`. Betroffen sind sechs Dateien.
   Folge: Matthews News-Feld kann diese Bilder nicht mehr auswählen. Akzeptiert,
   weil Wiederverwendung in sechs Jahren zweimal vorkam — beide Male als
   versehentliche Kopie, woraus die zwei Dubletten entstanden.
5. **Rolle im Dateinamen, englisch, nur in `products` und `glazes`.** Vokabular
   aus den echten Template-Slots: `hero`, `banner`, `feature`, `tile`, `card`,
   `section`, `signature`. In `news` und `workshop` bleiben die Namen rein
   beschreibend, weil es dort keinen festen Slot gibt.
   Das Seitenverhältnis steht bewusst **nicht** im Namen: Es ist abgeleitete
   Information, die bei jedem Neuzuschnitt lügt und dann Referenzen in drei
   Datendateien nachzieht.
6. **Galerie-Feld zeigt auf `src/images/glazes`.** Uploads landen dort flach,
   Dan sortiert sie nach. Eine Vorkehrung dagegen wäre teurer als die Korrektur.
7. **43 Dateien nach `_archive`** im Wurzelverzeichnis, versioniert,
   außerhalb von `src` und damit für den Build unsichtbar. Keine Änderung an der
   Passthrough-Kopie nötig, kein `.gitignore`-Eintrag.
8. **Matthews vier Rohdateien nach `_archive/originals/`.** Dieser Unterordner bleibt
   dauerhaft und wird beim späteren Leeren des Archivs **nicht** gelöscht.
9. **`src/assets` bleibt unangetastet.** Favicons, Manifest und
   Social-Media-Vorschaubild sind technisches Beiwerk. Einzige Prüfung: ob die
   zwei PWA-Screenshots nach dem Entfernen der PWA noch gebraucht werden.
10. **Landet direkt auf `feat/site-redesign-v2`**, in mehreren kleinen Commits.
    `origin/main` ist vollständig in v2 enthalten, es gibt keinen Rückstand.

## Bewusst nicht getan

- **Redirects für alte `/images/...`-URLs.** Nicht nötig, siehe Befunde.
- **Krumme Seitenverhältnisse begradigen.** Achtzehn Dateien liegen bei 1.44 oder
  1.48 statt 3:2. Das ist Bildbearbeitung, kein Aufräumen, und gehört zum
  offenen Foto-Thema aus `2026-07-21-matthew-feedback-v2-design.md`.
- **`feat/tinacms-migration` mitziehen.** Dort fehlen 19 Commits. Die
  Umbenennung vergrößert die Konfliktfläche dieses Merges; das ist ein eigenes
  Vorhaben und soll das Aufräumen nicht blockieren.
- **Die restlichen zu kleinen Produktfotos ersetzen.** Vier der neun sind am
  2026-09-12 durch Shop-Master ersetzt worden, die übrigen bleiben offen.

## Risiken

- **Matthew editiert weiter auf `main`.** Events enthalten keine Bildpfade, das
  ist harmlos. Ein neuer News-Eintrag in der Umbauphase kollidiert dagegen mit
  dem Umschreiben sämtlicher Pfade in `news.json`. Je kürzer die Phase, desto
  kleiner das Fenster.
- **Das Archiv ist eine Sichtungsstation, kein Endzustand.** Wird es nicht
  innerhalb weniger Wochen geleert, ist es der nächste unklare Ordner.

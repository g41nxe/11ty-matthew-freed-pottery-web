# Bildbestand neu ordnen — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/images` von 95 unsortierten Dateien auf fünf motivische Ordner mit durchgängigem Namensschema bringen, 44 Karteileichen und Rohdateien nach `_archive` auslagern, und alle Referenzen inklusive der Decap-Konfiguration nachziehen.

**Architecture:** Reine Datei- und Referenzarbeit. Kein Build-Tooling, keine Abhängigkeiten, kein JavaScript. Jede Verschiebung erfolgt mit `git mv`, damit Git die Umbenennung verfolgt. Jede Task endet mit einem grünen Build und einem Commit.

**Tech Stack:** Eleventy 3.1.6 + Nunjucks, `@11ty/eleventy-img` 6, Decap CMS 3.14, Netlify.

**Spec:** `docs/superpowers/specs/2026-09-12-image-library-reorg-design.md`

## Global Constraints

- Branch: `feat/site-redesign-v2`. Direkt darauf landen, kein Sub-Branch.
- **Dieses Repo hat kein Test-Framework.** `npm test` ist ein Stub, der mit 1 endet. Verifikation ist: `npm run build` endet mit 0, plus der Manifest-Vergleich aus Task 1, plus gezielte Greps. **Erfinde keinen Test-Runner.**
- **Der erste Build nach `npm run clean` dauert rund 200 Sekunden**, weil alle Bildvarianten neu erzeugt werden. Setze das Timeout entsprechend hoch oder lass den Build im Hintergrund laufen.
- **`eleventy-img` hasht Dateiinhalt und Sharp-Optionen, nicht den Pfad** (`node_modules/@11ty/eleventy-img/src/image.js:432`). Ein reiner Umzug lässt die **erzeugten Varianten** deshalb byte-identisch.
- **`dist/images` enthält zweierlei.** Die erzeugten Varianten mit Namensmuster `<hash>-<breite>.<format>` und die Passthrough-Kopien der Quelldateien unter ihrem Originalpfad. Nur die Varianten sind der Prüfmaßstab: Sie dürfen sich nicht ändern. Die Passthrough-Kopien wandern selbstverständlich mit, ihre Pfade ändern sich in jeder Task. Vergleiche deshalb mit diesem Filter:

  ```bash
  varianten() { grep -E -- '-(160|320|640|768|1024|1280|1536|1920)\.(avif|webp|jpeg)$' "$1" | sort; }
  ```

  **Null neue Varianten** ist die Bedingung, die in jeder Task gelten muss. Verschwundene Varianten sind nur dort erlaubt, wo die Task eine Datei absichtlich aus dem Bestand nimmt.
- **Alle Verschiebungen mit `git mv`**, nie mit `mv`. Sonst verliert Git die Umbenennungserkennung und der Diff wird unlesbar.
- **Reihenfolge beim Ersetzen von Pfaden:** immer zuerst die längeren Pfade mit Unterordner (`/images/updates/...`), danach die kurzen aus dem Wurzelordner. Sonst greift eine Teilersetzung ins Leere.
- **`_archive` liegt im Repo-Wurzelverzeichnis, nicht unter `src`.** Eleventys Eingabeordner ist `src/views`, alle Passthrough-Kopien zeigen auf `src/...`. Deshalb ist an `.eleventy.js` **nichts** zu ändern.
- **`_archive/originals/` bleibt dauerhaft.** Beim späteren Leeren des Archivs darf dieser Unterordner nicht mit gelöscht werden.
- **`src/assets` wird nicht angefasst**, mit der einen Prüfung in Task 8.
- Die Zuordnungstabellen in diesem Plan geben den Stand vom 2026-09-12 wieder. Task 1 prüft sie gegen das Arbeitsverzeichnis, bevor irgendetwas verschoben wird.
- **Die Vergleichsmanifeste gehören nicht ins Repo.** Setze einmal zu Beginn `M=<scratchpad-verzeichnis der session>` und schreibe alle `*.txt` aus den Verifikationsschritten nach `$M/`. Die Befehle im Plan sind verkürzt notiert; ergänze das `$M/` beim Ausführen.
- **Jede Task ist einzeln zurücknehmbar.** Schlägt eine Prüfung fehl und du willst neu ansetzen, verwirf die unfertige Task mit `git checkout -- . && git clean -fd src/images`. Ein bereits committeter Task-Stand wird mit `git revert <hash>` zurückgenommen, nicht mit `reset --hard` — der Umbau läuft auf einem Branch, der auch auf `origin` liegt.
- **Nie `git add -A` im Repo-Wurzelverzeichnis ohne Pfadangabe.** Die Commit-Befehle in diesem Plan nennen jeweils die betroffenen Verzeichnisse. `.claude/launch.json` trägt unabhängige lokale Änderungen und darf in keinem dieser Commits landen.

---

## Dateiübersicht

| Ziel | Inhalt | Dateien |
|---|---|---|
| `src/images/glazes/<linie>/` | Stücke einer Glasurlinie, 15 Unterordner | 20 |
| `src/images/products/` | Freigestellte Shop-Artikel | 16 |
| `src/images/news/` | Beitragsbilder ohne Glasurbezug | 9 |
| `src/images/workshop/` | Werkstatt, Markt, Laden, Arrangements | 8 |
| `src/images/site/` | Hero-Fallback und Signatur | 2 |
| `_archive/` | Karteileichen und Dubletten | 39 |
| `_archive/originals/` | Matthews Rohdateien | 4 |

Summe: 98 Dateien liegen heute unter `src/images`, 55 davon bleiben, 43 gehen ins Archiv.

Referenzen werden nachgezogen in `src/views/_data/showcase.json`, `src/views/_data/news.json`, `src/views/_data/global.json`, im Front Matter von `about.md`, `events.md`, `home.md`, `pottery.md`, `process.md` und `retail-stores.md`, in der fest verdrahteten Signatur in `src/views/_includes/layouts/events-layout.njk:77` sowie in **vierzehn** Bildfeldern in `src/admin/config.yml`.

---

### Task 1: Ausgangslage sichern

Der Umbau darf nicht mit fremden Änderungen in einem Diff landen. Hier wird der Baum sauber gemacht, der Plan gegen den Ist-Zustand geprüft und die Vergleichsbasis erzeugt, an der alle späteren Tasks gemessen werden.

**Files:**
- Commit: `docs/superpowers/plans/2026-09-12-image-library-reorg.md`, `docs/superpowers/specs/2026-09-12-image-library-reorg-design.md`, `src/images/joffre-mug.jpg` (alle drei bisher ungetrackt)

**Interfaces:**
- Consumes: nichts.
- Produces: `baseline-manifest.txt` im Scratchpad, gegen den die Tasks 3 bis 7 prüfen.

- [ ] **Schritt 1: Die offenen Änderungen ansehen**

```bash
git status -s
```

Erwartet: genau drei ungetrackte Dateien — dieser Plan, sein Spec, und `src/images/joffre-mug.jpg`. Ist sonst etwas offen, **halte an**: Es gehört nicht in diesen Umbau.

`joffre-mug.jpg` ist Dans zweite Ableitung aus Matthews Joffre-Rohdatei. Sie wird heute nirgends verwendet und ist trotzdem Vorrat, kein Totholz — sie wandert in Task 3 nach `glazes/joffre/mug-card.jpg`.

- [ ] **Schritt 2: Auf dem richtigen Branch mit sauberem Baum stehen**

```bash
git rev-parse --abbrev-ref HEAD
git status --porcelain -- src docs
```

Erwartet: `feat/site-redesign-v2`, und außer den drei ungetrackten Dateien aus Schritt 1 nichts Offenes. Stehst du woanders oder liegen fremde Änderungen an, **halte an**.

- [ ] **Schritt 3: Den Plan maschinell gegen das Arbeitsverzeichnis prüfen**

Der Bildbestand hat sich am 2026-09-12 während der Planung zweimal verändert. Statt die Tabellen von Hand abzugleichen, prüfe sie mit diesem Skript. Es liest die `git mv`-Befehle direkt aus dem Plan.

```bash
cat > "$M/preflight.py" <<'PY'
import re,os,glob,collections
plan=open('docs/superpowers/plans/2026-09-12-image-library-reorg.md',encoding='utf-8').read()
moves=[(m.group(1),m.group(2)) for m in re.finditer(r'^git mv\s+(\S+)\s+(\S+)\s*$',plan,re.M)]
# Der Windows-Umweg fuer die .JPG-Datei ist eine Alternative, kein Zusatzschritt
moves=[(s,d) for s,d in moves if 'holiday-2022-tmp' not in s and 'holiday-2022-tmp' not in d]
fehler=0
fehlt=[s for s,d in moves if not os.path.exists(s)]
if fehlt: fehler+=1; print('FEHLER Quellen fehlen:'); [print('   ',s) for s in fehlt]
c=collections.Counter(s for s,d in moves)
dop=[s for s,n in c.items() if n>1]
if dop: fehler+=1; print('FEHLER doppelt verschoben:'); [print('   ',s) for s in dop]
t=collections.Counter(d for s,d in moves)
kol=[d for d,n in t.items() if n>1 and not d.endswith('/')]
if kol: fehler+=1; print('FEHLER Zielkollision:'); [print('   ',d) for d in kol]
platte=set(p.replace(os.sep,'/') for p in glob.glob('src/images/**/*.*',recursive=True))
bewegt=set(s.replace(os.sep,'/') for s,d in moves)
offen=sorted(platte-bewegt)
if offen: fehler+=1; print('FEHLER nicht im Plan:'); [print('   ',p) for p in offen]
geist=sorted(bewegt-platte)
if geist: fehler+=1; print('FEHLER im Plan, aber nicht auf Platte:'); [print('   ',p) for p in geist]
print(('OK' if not fehler else 'ABBRUCH')+': %d Dateien auf Platte, %d Verschiebungen im Plan' % (len(platte),len(moves)))
PY
python -X utf8 "$M/preflight.py"
```

Erwartet: `OK: 98 Dateien auf Platte, 98 Verschiebungen im Plan`.

Meldet das Skript `ABBRUCH`, **halte an und melde die Abweichung**, statt die Tabellen zu raten. Eine fehlende Quelle heißt, dass jemand eine Datei gelöscht oder umbenannt hat; eine nicht erfasste Datei heißt, dass eine dazugekommen ist und einen Zielordner braucht.

- [ ] **Schritt 4: Plan, Spec und den Joffre-Vorrat committen**

```bash
git add docs/superpowers/plans/2026-09-12-image-library-reorg.md docs/superpowers/specs/2026-09-12-image-library-reorg-design.md src/images/joffre-mug.jpg
git commit -m "docs: Plan und Design fuer die Neuordnung des Bildbestands

Dazu die zweite Ableitung aus Matthews Joffre-Rohdatei, die als Vorrat
mitlaeuft und in Task 3 ihren Platz bekommt.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Schritt 5: Sauberen Build erzeugen**

```bash
npm run build
```

Erwartet: Exit-Code 0. Dauer rund 200 Sekunden.

- [ ] **Schritt 6: Vergleichsmanifest schreiben**

```bash
find dist/images -type f -exec md5sum {} + | sed 's|dist/images/||' | sort -k2 > baseline-manifest.txt
wc -l baseline-manifest.txt
```

Lege `baseline-manifest.txt` im Scratchpad-Verzeichnis der Session ab, **nicht** im Repo. Notiere die Zeilenzahl — sie muss am Ende jeder folgenden Task identisch sein.

---

### Task 2: Archiv anlegen und Totholz auslagern

41 Dateien verlassen `src/images`: 36 nie referenzierte, darunter die fünf Silvesterbilder von 2020, eine byte-identische Dublette und Matthews vier Rohdateien. Zwei weitere, `squamish-nights.jpg` und die zweite Dublette, folgen in Task 3, sobald ihre Referenzen umgebogen sind.

**Files:**
- Create: `_archive/` und `_archive/originals/`
- Move: 41 Dateien aus `src/images`

**Interfaces:**
- Consumes: den Commit aus Task 1.
- Produces: ein `src/images`, das nur noch referenzierte Dateien enthält. Task 3 bis 7 setzen darauf auf.

**Warum `_archive` außerhalb von `src` liegt.** Eleventys Eingabeordner ist `src/views`, und jede Passthrough-Kopie in `.eleventy.js` zeigt auf einen Pfad unter `src/`. Alles außerhalb ist für den Build unsichtbar. Läge das Archiv unter `src/images`, würden die 25 MB weiter bei jedem Build nach `dist` kopiert und mit deployt — dann hättest du nur den Explorer aufgeräumt, nicht das Deployment.

- [ ] **Schritt 1: Ordner anlegen**

```bash
mkdir -p _archive/originals
```

- [ ] **Schritt 2: Matthews Rohdateien sichern**

```bash
git mv src/images/new/joffre.jpg          _archive/originals/joffre.jpg
git mv src/images/new/joffre2.jpg         _archive/originals/joffre2.jpg
git mv src/images/new/squamishnights.jpg  _archive/originals/squamishnights.jpg
git mv src/images/new/tofino2.jpg         _archive/originals/tofino2.jpg
```

Das sind die unkomprimierten Vorlagen, aus denen `joffre-bowls.jpg` und `tofino-tea-set.jpg` entstanden sind. Sie bleiben dauerhaft liegen, damit ein späterer Neuzuschnitt nicht an Matthew zurückgehen muss.

Matthew hatte fünf Dateien geschickt; `new/tofino.jpg` hat Dan am 2026-09-12 verworfen, nachdem `tofino2.jpg` das bessere Motiv war. Ist die Datei wider Erwarten doch da, nimm sie mit auf.

- [ ] **Schritt 3: Die Kitsilano-Dublette auflösen**

```bash
git mv src/images/updates/carousel-kitsilano2.jpg _archive/carousel-kitsilano2--updates-dupe.jpg
```

Byte-identisch mit der Fassung im Wurzelordner, und anders als jene von nichts referenziert — `news.json` zeigt auf die Wurzelfassung.

**Die zweite Dublette, `updates/garibaldi-cropped.jpg`, bleibt hier liegen.** Sie ist byte-identisch mit der Wurzelfassung, wird aber von einem News-Eintrag noch benutzt. Würde sie jetzt verschwinden, schlüge der Build in Schritt 6 fehl. Task 3 biegt die Referenz um und archiviert sie danach.

- [ ] **Schritt 4: Die restlichen Karteileichen auslagern**

```bash
git mv src/images/20210326_135057.jpg            _archive/
git mv src/images/blue-mug-and-plate.jpg         _archive/
git mv src/images/carousel-dogwood.jpg           _archive/
git mv src/images/carousel-dogwood2.jpg          _archive/
git mv src/images/carousel-jericho.jpg           _archive/
git mv src/images/carousel-joffre.jpg            _archive/
git mv src/images/carousel-joffre2.jpg           _archive/
git mv src/images/carousel-kitsilano.jpg         _archive/
git mv src/images/carousel-pemberton-earth.jpg   _archive/
git mv src/images/carousel-pemberton-sky.jpg     _archive/
git mv src/images/carousel-saltspring.jpg        _archive/
git mv src/images/carousel-strathcona.jpg        _archive/
git mv src/images/carousel-tofino.jpg            _archive/
git mv src/images/carousel-tofino2.jpg           _archive/
git mv src/images/carousel-tree-of-life-2.jpg    _archive/
git mv src/images/carousel-yaletown.jpg          _archive/
git mv src/images/carousel-zen.jpg               _archive/
git mv src/images/carousel-zen2.jpg              _archive/
git mv src/images/carousel-zen3.jpg              _archive/
git mv src/images/dsc06388-cropped.jpg           _archive/
git mv src/images/dsc06947-cropped-1.jpg         _archive/
git mv src/images/dsc07100-cropped.jpg           _archive/
git mv src/images/matthew-and-mugs.jpg           _archive/
git mv src/images/mixed-display.jpg              _archive/
git mv src/images/mthw-22-cropped.jpg            _archive/
git mv src/images/oil-dispenser.jpg              _archive/
git mv src/images/pottery-in-action-1.jpg        _archive/
git mv src/images/pottery-in-action-4.jpg        _archive/
git mv src/images/retail-sign.jpg                _archive/
git mv src/images/features/feature-belly-mug-galliano.jpg _archive/
git mv src/images/updates/yaletown-display.jpg   _archive/
git mv src/images/new/20201231_105518.jpg        _archive/
git mv src/images/new/20201231_114201.jpg        _archive/
git mv src/images/new/20201231_114218.jpg        _archive/
git mv src/images/new/20201231_115146.jpg        _archive/
git mv src/images/new/20201231_115511.jpg        _archive/
```

**`squamish-nights.jpg` bleibt hier absichtlich liegen.** Die Datei ist noch das Galeriebild der Squamish-Nights-Linie. Würde sie jetzt ins Archiv wandern, fände der Bild-Shortcode sie nicht mehr und der Build in Schritt 6 schlüge fehl. Task 3 biegt erst die Referenz um und archiviert sie danach.

- [ ] **Schritt 5: Leere Ordner prüfen**

```bash
find src/images -type d -empty
```

Erwartet: `src/images/new`. Dieser Ordner ist jetzt leer und verschwindet mit dem Commit von selbst, weil Git keine leeren Verzeichnisse verfolgt.

- [ ] **Schritt 6: Bauen und Manifest vergleichen**

```bash
npm run build
find dist/images -type f -exec md5sum {} + | sed 's|dist/images/||' | sort -k2 > after-task2.txt
diff baseline-manifest.txt after-task2.txt
```

Erwartet: `npm run build` endet mit 0. Der `diff` zeigt **nur entfernte Zeilen**, keine hinzugefügten und keine geänderten. Entfernt werden die Varianten der ausgelagerten Dateien. Taucht eine **neue** Zeile auf, hat sich ein Dateiinhalt geändert — dann ist etwas schiefgegangen.

Merke dir die neue Zeilenzahl als Basis für Task 3.

- [ ] **Schritt 7: Committen**

```bash
git add -A _archive src/images
git commit -m "chore: 44 ungenutzte Bilder nach _archive auslagern

37 nie referenzierte Dateien, zwei byte-identische Dubletten, funf
Silvesteraufnahmen von 2020 und Matthews funf Rohdateien. _archive liegt
ausserhalb von src und ist damit fur den Build unsichtbar, spart also
25 MB pro Deployment. Die Rohdateien unter _archive/originals bleiben
dauerhaft.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Glasurlinien einsortieren

Zwanzig Dateien wandern in fünfzehn Unterordner. Der Ordner trägt die Linie, der Dateiname trägt Motiv und Rolle.

**Files:**
- Create: `src/images/glazes/<15 Unterordner>`
- Move: 20 Dateien
- Modify: `src/views/_data/showcase.json`, `src/views/_data/news.json`, `src/views/home.md`

**Interfaces:**
- Consumes: das aufgeräumte `src/images` aus Task 2.
- Produces: die Pfade unter `/images/glazes/`, auf die Task 7 die Decap-Felder ausrichtet.

**Namensregel.** `<motiv>-<rolle>.jpg`. Das Motiv stammt aus dem vorhandenen Alt-Text, nicht aus einer Erfindung. Die Rolle kommt aus dem Template-Slot, in dem die Datei tatsächlich steckt.

| Quelle | Ziel |
|---|---|
| `src/images/updates/squamish-nights-close.jpg` | `glazes/squamish-nights/vase-closeup-hero.jpg` |
| `src/images/garibaldi-cropped.jpg` | `glazes/garibaldi/large-mug-card.jpg` |
| `src/images/carousel-yaletown2.jpg` | `glazes/yaletown/large-mug-card.jpg` |
| `src/images/updates/yaletown-happyholidays.jpg` | `glazes/yaletown/belly-mug-winter-card.jpg` |
| `src/images/updates/yaletown-display2.jpg` | `glazes/yaletown/display-card.jpg` |
| `src/images/carousel-galiano.jpg` | `glazes/galiano/plates-and-mugs-card.jpg` |
| `src/images/carousel-dogwood3.jpg` | `glazes/dogwood/large-bowls-card.jpg` |
| `src/images/carousel-saltspring2.jpg` | `glazes/saltspring/large-platter-card.jpg` |
| `src/images/carousel-jericho2.jpg` | `glazes/jericho/bowls-and-platter-card.jpg` |
| `src/images/joffre-bowls.jpg` | `glazes/joffre/bowls-card.jpg` |
| `src/images/joffre-mug.jpg` | `glazes/joffre/mug-card.jpg` |
| `src/images/carousel-kitsilano3.jpg` | `glazes/kitsilano/bowls-card.jpg` |
| `src/images/carousel-kitsilano2.jpg` | `glazes/kitsilano/bowls-mugs-vase-card.jpg` |
| `src/images/carousel-pemberton-sky2.jpg` | `glazes/pemberton-sky/bowl-card.jpg` |
| `src/images/carousel-pemberton-earth2.jpg` | `glazes/pemberton-earth/bowls-and-platter-card.jpg` |
| `src/images/carousel-strathcona2.jpg` | `glazes/strathcona/platter-card.jpg` |
| `src/images/tofino-tea-set.jpg` | `glazes/tofino/tea-set-feature.jpg` |
| `src/images/carousel-tree-of-life.jpg` | `glazes/tree-of-life/bowls-and-jar-card.jpg` |
| `src/images/updates/treeoflife-teaset.jpg` | `glazes/tree-of-life/tea-set-card.jpg` |
| `src/images/carousel-zen4.jpg` | `glazes/zen/snack-bowl-card.jpg` |

`joffre-mug.jpg` ist heute unreferenziert. Es wandert trotzdem mit, weil Dan es bewusst aus Matthews Rohdatei gezogen hat — es ist Vorrat, keine Karteileiche.

**Die beiden Teeservice-Fotos haben am 2026-09-12 die Rollen getauscht.** Commit `25a9864` hat die Startseiten-Sektion auf eine einzige Glasur umgestellt: Das Tofino-Teeset füllt jetzt den großen Slot mit 528px, das Tree-of-Life-Teeset ist dort ausgezogen und erscheint nur noch als News-Karte mit 445px. Deshalb heißt das Tofino-Bild `tea-set-feature.jpg` und das Tree-of-Life-Bild `tea-set-card.jpg`. Bei einer Datei in mehreren Slots benennt die Rolle den **anspruchsvollsten** — das Tofino-Foto dient zusätzlich als Galeriekarte, muss aber den größeren Slot bedienen.

- [ ] **Schritt 1: Unterordner anlegen**

```bash
mkdir -p src/images/glazes/{squamish-nights,garibaldi,yaletown,galiano,dogwood,saltspring,jericho,joffre,kitsilano,pemberton-sky,pemberton-earth,strathcona,tofino,tree-of-life,zen}
```

- [ ] **Schritt 2: Dateien verschieben**

```bash
git mv src/images/updates/squamish-nights-close.jpg src/images/glazes/squamish-nights/vase-closeup-hero.jpg
git mv src/images/garibaldi-cropped.jpg             src/images/glazes/garibaldi/large-mug-card.jpg
git mv src/images/carousel-yaletown2.jpg            src/images/glazes/yaletown/large-mug-card.jpg
git mv src/images/updates/yaletown-happyholidays.jpg src/images/glazes/yaletown/belly-mug-winter-card.jpg
git mv src/images/updates/yaletown-display2.jpg     src/images/glazes/yaletown/display-card.jpg
git mv src/images/carousel-galiano.jpg              src/images/glazes/galiano/plates-and-mugs-card.jpg
git mv src/images/carousel-dogwood3.jpg             src/images/glazes/dogwood/large-bowls-card.jpg
git mv src/images/carousel-saltspring2.jpg          src/images/glazes/saltspring/large-platter-card.jpg
git mv src/images/carousel-jericho2.jpg             src/images/glazes/jericho/bowls-and-platter-card.jpg
git mv src/images/joffre-bowls.jpg                  src/images/glazes/joffre/bowls-card.jpg
git mv src/images/joffre-mug.jpg                    src/images/glazes/joffre/mug-card.jpg
git mv src/images/carousel-kitsilano3.jpg           src/images/glazes/kitsilano/bowls-card.jpg
git mv src/images/carousel-kitsilano2.jpg           src/images/glazes/kitsilano/bowls-mugs-vase-card.jpg
git mv src/images/carousel-pemberton-sky2.jpg       src/images/glazes/pemberton-sky/bowl-card.jpg
git mv src/images/carousel-pemberton-earth2.jpg     src/images/glazes/pemberton-earth/bowls-and-platter-card.jpg
git mv src/images/carousel-strathcona2.jpg          src/images/glazes/strathcona/platter-card.jpg
git mv src/images/tofino-tea-set.jpg                src/images/glazes/tofino/tea-set-feature.jpg
git mv src/images/carousel-tree-of-life.jpg         src/images/glazes/tree-of-life/bowls-and-jar-card.jpg
git mv src/images/updates/treeoflife-teaset.jpg     src/images/glazes/tree-of-life/tea-set-card.jpg
git mv src/images/carousel-zen4.jpg                 src/images/glazes/zen/snack-bowl-card.jpg
```

- [ ] **Schritt 3: Referenzen umschreiben**

Die längeren `updates`-Pfade stehen zuerst, damit keine Teilersetzung ins Leere greift.

```bash
FILES="src/views/_data/showcase.json src/views/_data/news.json src/views/home.md"
sed -i \
 -e 's|/images/updates/squamish-nights-close\.jpg|/images/glazes/squamish-nights/vase-closeup-hero.jpg|g' \
 -e 's|/images/updates/yaletown-happyholidays\.jpg|/images/glazes/yaletown/belly-mug-winter-card.jpg|g' \
 -e 's|/images/updates/yaletown-display2\.jpg|/images/glazes/yaletown/display-card.jpg|g' \
 -e 's|/images/updates/treeoflife-teaset\.jpg|/images/glazes/tree-of-life/tea-set-card.jpg|g' \
 -e 's|/images/updates/garibaldi-cropped\.jpg|/images/glazes/garibaldi/large-mug-card.jpg|g' \
 -e 's|/images/carousel-kitsilano2\.jpg|/images/glazes/kitsilano/bowls-mugs-vase-card.jpg|g' \
 -e 's|/images/garibaldi-cropped\.jpg|/images/glazes/garibaldi/large-mug-card.jpg|g' \
 -e 's|/images/carousel-yaletown2\.jpg|/images/glazes/yaletown/large-mug-card.jpg|g' \
 -e 's|/images/carousel-galiano\.jpg|/images/glazes/galiano/plates-and-mugs-card.jpg|g' \
 -e 's|/images/carousel-dogwood3\.jpg|/images/glazes/dogwood/large-bowls-card.jpg|g' \
 -e 's|/images/carousel-saltspring2\.jpg|/images/glazes/saltspring/large-platter-card.jpg|g' \
 -e 's|/images/carousel-jericho2\.jpg|/images/glazes/jericho/bowls-and-platter-card.jpg|g' \
 -e 's|/images/joffre-bowls\.jpg|/images/glazes/joffre/bowls-card.jpg|g' \
 -e 's|/images/carousel-kitsilano3\.jpg|/images/glazes/kitsilano/bowls-card.jpg|g' \
 -e 's|/images/carousel-pemberton-sky2\.jpg|/images/glazes/pemberton-sky/bowl-card.jpg|g' \
 -e 's|/images/carousel-pemberton-earth2\.jpg|/images/glazes/pemberton-earth/bowls-and-platter-card.jpg|g' \
 -e 's|/images/carousel-strathcona2\.jpg|/images/glazes/strathcona/platter-card.jpg|g' \
 -e 's|/images/tofino-tea-set\.jpg|/images/glazes/tofino/tea-set-feature.jpg|g' \
 -e 's|/images/carousel-tree-of-life\.jpg|/images/glazes/tree-of-life/bowls-and-jar-card.jpg|g' \
 -e 's|/images/carousel-zen4\.jpg|/images/glazes/zen/snack-bowl-card.jpg|g' \
 $FILES
```

- [ ] **Schritt 4: Das Squamish-Nights-Galeriebild umstellen**

Die Galerie zeigt noch auf `/images/squamish-nights.jpg`, das in Task 2 ins Archiv gewandert ist. In `src/views/_data/showcase.json` steht im ersten Galerie-Eintrag:

```json
      "image": {
        "url": "/images/squamish-nights.jpg",
        "alt": "Squamish Nights Teardrop Vase by Matthew Freed"
      },
```

Ändere es zu:

```json
      "image": {
        "url": "/images/glazes/squamish-nights/vase-closeup-hero.jpg",
        "alt": "Close-up of the celestial speckle on a Squamish Nights vase by Matthew Freed"
      },
```

Der Alt-Text wird mitgezogen, weil er sonst ein Motiv beschreibt, das nicht mehr im Bild ist. Die Formulierung ist aus `src/views/home.md:21` übernommen, wo dieselbe Datei bereits als Hero dient.

- [ ] **Schritt 5: Die zwei nachgezogenen Dateien archivieren**

Erst jetzt, keinen Schritt früher, sind beide unreferenziert. `squamish-nights.jpg` hat in Schritt 4 sein Galeriebild verloren, `updates/garibaldi-cropped.jpg` in Schritt 3 seinen News-Eintrag.

```bash
grep -rn "squamish-nights\.jpg\|updates/garibaldi-cropped" src/views src/admin
git mv src/images/squamish-nights.jpg           _archive/squamish-nights.jpg
git mv src/images/updates/garibaldi-cropped.jpg _archive/garibaldi-cropped--updates-dupe.jpg
```

Der `grep` muss **vor** den beiden `git mv` ohne Treffer bleiben. Findet er etwas, sind Schritt 3 oder 4 nicht vollständig ausgeführt.

- [ ] **Schritt 6: Prüfen, dass kein alter Pfad übrig ist**

```bash
grep -rn "carousel-\|squamish-nights\.jpg\|garibaldi-cropped\|treeoflife-teaset\|yaletown-happyholidays\|yaletown-display2\|joffre-bowls\|tofino-tea-set" src/views src/admin
```

Erwartet: keine Treffer.

- [ ] **Schritt 7: Bauen und Manifest vergleichen**

```bash
npm run build
find dist/images -type f -exec md5sum {} + | sed 's|dist/images/||' | sort -k2 > after-task3.txt
diff after-task2.txt after-task3.txt
```

Erwartet: **nur entfernte Zeilen**, und zwar genau die Varianten von `squamish-nights.jpg`, das in Schritt 5 ins Archiv gewandert ist. Alle übrigen Dateien sind inhaltlich unverändert und nur verschoben, ihre Varianten müssen also identisch bleiben. Eine **hinzugefügte** Zeile heißt, dass eine Datei ersetzt statt verschoben wurde.

Dass der Galerietausch in Schritt 4 keine neuen Varianten erzeugt, ist erwartet: Die Datei war über `home.md` längst eingebunden.

- [ ] **Schritt 8: Committen**

```bash
git add -A src/images src/views
git commit -m "refactor: Glasurfotos nach glazes/<linie> sortieren

Fuenfzehn Unterordner, einer je Linie. Dateinamen tragen Motiv und
Template-Rolle. Bei Motivkonflikt gewinnt die Glasur: sechs Bilder, die
bisher unter updates lagen, gehoeren hierher, auch wenn sie in News
verwendet werden.

Das Squamish-Nights-Galeriebild zeigt jetzt auf die Nahaufnahme, die
ohnehin schon als Startseiten-Hero dient.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Produktfotos einsortieren

Sechzehn freigestellte Shop-Artikel. Der Ordner `features` heißt künftig `products`, die Namen folgen durchgängig dem Muster Glasur, Objekt, Rolle.

**Files:**
- Create: `src/images/products/`
- Move: 16 Dateien aus `src/images/features/`
- Modify: `src/views/_data/showcase.json`

**Interfaces:**
- Consumes: nichts aus Task 3.
- Produces: die Pfade unter `/images/products/`, auf die Task 7 das Produktfeld ausrichtet.

**Warum flach und nicht zweistufig.** Sechzehn Dateien, die alle denselben 4:3-Slot bedienen. Unterordner je Linie ergäben Ordner mit ein bis fünf Dateien.

**Vier davon kamen am 2026-09-12 dazu**, aus Commit `25a9864`. Sie stammen aus den Produktmastern des Shops mit 2000 bis 2560px und ersetzen 400×300-Dateien, die für eine 254px-Kachel bei doppelter Pixeldichte 27% zu klein waren. Die abgelösten Dateien bleiben vorerst in Gebrauch, weil die Sektion sie in den hinteren Positionen weiterhin anzeigt.

| Quelle | Ziel |
|---|---|
| `features/tofino-medium-teapot.jpg` | `products/tofino-medium-teapot-tile.jpg` |
| `features/tofino-belly-mug.jpg` | `products/tofino-belly-mug-tile.jpg` |
| `features/tofino-vase.jpg` | `products/tofino-vase-tile.jpg` |
| `features/tofino-dinner-plate.jpg` | `products/tofino-dinner-plate-tile.jpg` |
| `features/tofino-chopstick-bowl.jpg` | `products/tofino-chopstick-bowl-tile.jpg` |
| `features/jericho-teardrop-vase.jpg` | `products/jericho-teardrop-vase-tile.jpg` |
| `features/squamish-nights-shorty-mug.jpg` | `products/squamish-nights-shorty-mug-tile.jpg` |
| `features/feature-large-square-platter-pemberton-earth.jpg` | `products/pemberton-earth-large-square-platter-tile.jpg` |
| `features/tree-of-life-pitcher.jpg` | `products/tree-of-life-pitcher-tile.jpg` |
| `features/yaletown-red-teapot.jpg` | `products/yaletown-red-teapot-tile.jpg` |
| `features/feature-belly-mug-jericho.jpg` | `products/jericho-belly-mug-tile.jpg` |
| `features/feature-belly-mug-yaletown-green.jpg` | `products/yaletown-green-belly-mug-tile.jpg` |
| `features/feature-belly-mug-yaletown-red.jpg` | `products/yaletown-red-belly-mug-tile.jpg` |
| `features/feature-chopstick-bowl-joffre.jpg` | `products/joffre-chopstick-bowl-tile.jpg` |
| `features/feature-chopstick-bowl-yaletown-green.jpg` | `products/yaletown-green-chopstick-bowl-tile.jpg` |
| `features/feature-wide-rim-platter-strathcona.jpg` | `products/strathcona-wide-rim-platter-tile.jpg` |

- [ ] **Schritt 1: Verschieben**

```bash
mkdir -p src/images/products
git mv src/images/features/tofino-medium-teapot.jpg                     src/images/products/tofino-medium-teapot-tile.jpg
git mv src/images/features/tofino-belly-mug.jpg                         src/images/products/tofino-belly-mug-tile.jpg
git mv src/images/features/tofino-vase.jpg                              src/images/products/tofino-vase-tile.jpg
git mv src/images/features/tofino-dinner-plate.jpg                      src/images/products/tofino-dinner-plate-tile.jpg
git mv src/images/features/tofino-chopstick-bowl.jpg                    src/images/products/tofino-chopstick-bowl-tile.jpg
git mv src/images/features/jericho-teardrop-vase.jpg                    src/images/products/jericho-teardrop-vase-tile.jpg
git mv src/images/features/squamish-nights-shorty-mug.jpg               src/images/products/squamish-nights-shorty-mug-tile.jpg
git mv src/images/features/feature-large-square-platter-pemberton-earth.jpg src/images/products/pemberton-earth-large-square-platter-tile.jpg
git mv src/images/features/tree-of-life-pitcher.jpg                     src/images/products/tree-of-life-pitcher-tile.jpg
git mv src/images/features/yaletown-red-teapot.jpg                      src/images/products/yaletown-red-teapot-tile.jpg
git mv src/images/features/feature-belly-mug-jericho.jpg                src/images/products/jericho-belly-mug-tile.jpg
git mv src/images/features/feature-belly-mug-yaletown-green.jpg         src/images/products/yaletown-green-belly-mug-tile.jpg
git mv src/images/features/feature-belly-mug-yaletown-red.jpg           src/images/products/yaletown-red-belly-mug-tile.jpg
git mv src/images/features/feature-chopstick-bowl-joffre.jpg            src/images/products/joffre-chopstick-bowl-tile.jpg
git mv src/images/features/feature-chopstick-bowl-yaletown-green.jpg    src/images/products/yaletown-green-chopstick-bowl-tile.jpg
git mv src/images/features/feature-wide-rim-platter-strathcona.jpg      src/images/products/strathcona-wide-rim-platter-tile.jpg
```

- [ ] **Schritt 2: Referenzen umschreiben**

```bash
sed -i \
 -e 's|/images/features/feature-large-square-platter-pemberton-earth\.jpg|/images/products/pemberton-earth-large-square-platter-tile.jpg|g' \
 -e 's|/images/features/feature-belly-mug-yaletown-green\.jpg|/images/products/yaletown-green-belly-mug-tile.jpg|g' \
 -e 's|/images/features/feature-belly-mug-yaletown-red\.jpg|/images/products/yaletown-red-belly-mug-tile.jpg|g' \
 -e 's|/images/features/feature-chopstick-bowl-yaletown-green\.jpg|/images/products/yaletown-green-chopstick-bowl-tile.jpg|g' \
 -e 's|/images/features/feature-chopstick-bowl-joffre\.jpg|/images/products/joffre-chopstick-bowl-tile.jpg|g' \
 -e 's|/images/features/feature-wide-rim-platter-strathcona\.jpg|/images/products/strathcona-wide-rim-platter-tile.jpg|g' \
 -e 's|/images/features/feature-belly-mug-jericho\.jpg|/images/products/jericho-belly-mug-tile.jpg|g' \
 -e 's|/images/features/tofino-medium-teapot\.jpg|/images/products/tofino-medium-teapot-tile.jpg|g'  -e 's|/images/features/tofino-dinner-plate\.jpg|/images/products/tofino-dinner-plate-tile.jpg|g'  -e 's|/images/features/tofino-belly-mug\.jpg|/images/products/tofino-belly-mug-tile.jpg|g'  -e 's|/images/features/tofino-chopstick-bowl\.jpg|/images/products/tofino-chopstick-bowl-tile.jpg|g'  -e 's|/images/features/tofino-vase\.jpg|/images/products/tofino-vase-tile.jpg|g' \
 -e 's|/images/features/jericho-teardrop-vase\.jpg|/images/products/jericho-teardrop-vase-tile.jpg|g' \
 -e 's|/images/features/squamish-nights-shorty-mug\.jpg|/images/products/squamish-nights-shorty-mug-tile.jpg|g' \
 -e 's|/images/features/tree-of-life-pitcher\.jpg|/images/products/tree-of-life-pitcher-tile.jpg|g' \
 -e 's|/images/features/yaletown-red-teapot\.jpg|/images/products/yaletown-red-teapot-tile.jpg|g' \
 src/views/_data/showcase.json
```

- [ ] **Schritt 3: Prüfen**

```bash
grep -rn "images/features" src/views src/admin
find src/images/features -type f 2>/dev/null
```

Erwartet: der erste Befehl findet nur noch den `media_folder`-Eintrag in `src/admin/config.yml`, den Task 7 nachzieht. Der zweite findet nichts.

- [ ] **Schritt 4: Bauen und Manifest vergleichen**

```bash
npm run build
find dist/images -type f -exec md5sum {} + | sed 's|dist/images/||' | sort -k2 > after-task4.txt
diff <(varianten after-task3.txt) <(varianten after-task4.txt)
```

Erwartet: **keine Ausgabe.** Kein Bild wurde inhaltlich verändert und keines fällt weg, also bleibt die Variantenmenge gleich.

- [ ] **Schritt 5: Committen**

```bash
git add -A src/images src/views
git commit -m "refactor: features/ wird products/ mit einheitlichen Namen

Bisher war der Ordner gespalten: acht Dateien hiessen feature-<typ>-<glasur>,
fuenf <glasur>-<typ>. Jetzt durchgaengig <glasur>-<objekt>-tile, passend zu
den Titeln in showcase.json.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: News-Bilder einsortieren

Neun Beitragsbilder ohne Glasurbezug. Der Ordner `updates` heißt künftig `news`, passend zum Datenschlüssel in `news.json`. Rollen stehen hier **nicht** im Namen, weil es keinen festen Slot gibt.

**Files:**
- Create: `src/images/news/`
- Move: 9 Dateien aus `src/images/updates/`
- Modify: `src/views/_data/news.json`

**Interfaces:**
- Consumes: Task 3 hat die sechs Glasur-Motive bereits aus `updates` herausgenommen.
- Produces: die Pfade unter `/images/news/`, auf die Task 7 das News-Feld ausrichtet.

Die neuen Namen stammen aus den Alt-Texten der jeweiligen Einträge, nicht aus Kameradateinamen.

| Quelle | Ziel | Alt-Text als Beleg |
|---|---|---|
| `updates/summer-2024.jpg` | `news/summer-2024.jpg` | unverändert |
| `updates/culture-crawl-2020.jpg` | `news/culture-crawl-2020.jpg` | unverändert |
| `updates/frankie-torres-47.JPG` | `news/holiday-2022.jpg` | "Matthew Freed Pottery Holiday" |
| `updates/dsc06224-cropped.jpg` | `news/studio-tools.jpg` | "Studio tools" |
| `updates/market-1.jpg` | `news/harmony-arts-festival.jpg` | "Harmony Arts Festival" |
| `updates/overheadwork-cropped.jpg` | `news/studio-large-bowl.jpg` | "Studio work large bowl" |
| `updates/website-screenshot.jpg` | `news/website-launch.jpg` | "art for everyday life" |
| `updates/mvimg_20190727_093817.jpg` | `news/busy-studio.jpg` | "Busy times in my little studio" |
| `updates/mugs.jpg` | `news/blank-mugs.jpg` | "100 blank mugs" |

`mugs.jpg` bleibt bewusst in `news` und wandert nicht nach `glazes`: Die Becher sind roh und unglasiert, gehören also zu keiner Linie. Die Endung von `frankie-torres-47.JPG` wird dabei auf Kleinschreibung normalisiert.

- [ ] **Schritt 1: Verschieben**

```bash
mkdir -p src/images/news
git mv src/images/updates/summer-2024.jpg           src/images/news/summer-2024.jpg
git mv src/images/updates/culture-crawl-2020.jpg    src/images/news/culture-crawl-2020.jpg
git mv src/images/updates/frankie-torres-47.JPG     src/images/news/holiday-2022.jpg
git mv src/images/updates/dsc06224-cropped.jpg      src/images/news/studio-tools.jpg
git mv src/images/updates/market-1.jpg              src/images/news/harmony-arts-festival.jpg
git mv src/images/updates/overheadwork-cropped.jpg  src/images/news/studio-large-bowl.jpg
git mv src/images/updates/website-screenshot.jpg    src/images/news/website-launch.jpg
git mv src/images/updates/mvimg_20190727_093817.jpg src/images/news/busy-studio.jpg
git mv src/images/updates/mugs.jpg                  src/images/news/blank-mugs.jpg
```

**Nur falls die `.JPG`-Zeile auf Windows scheitert**, ersetze sie durch diesen zweistufigen Umweg. Das ist ein Ersatz für die eine Zeile, kein zusätzlicher Schritt:

```bash
git mv src/images/updates/frankie-torres-47.JPG src/images/updates/holiday-2022-tmp.jpg
git mv src/images/updates/holiday-2022-tmp.jpg  src/images/news/holiday-2022.jpg
```

- [ ] **Schritt 2: Referenzen umschreiben**

```bash
sed -i \
 -e 's|/images/updates/summer-2024\.jpg|/images/news/summer-2024.jpg|g' \
 -e 's|/images/updates/culture-crawl-2020\.jpg|/images/news/culture-crawl-2020.jpg|g' \
 -e 's|/images/updates/frankie-torres-47\.JPG|/images/news/holiday-2022.jpg|g' \
 -e 's|/images/updates/dsc06224-cropped\.jpg|/images/news/studio-tools.jpg|g' \
 -e 's|/images/updates/market-1\.jpg|/images/news/harmony-arts-festival.jpg|g' \
 -e 's|/images/updates/overheadwork-cropped\.jpg|/images/news/studio-large-bowl.jpg|g' \
 -e 's|/images/updates/website-screenshot\.jpg|/images/news/website-launch.jpg|g' \
 -e 's|/images/updates/mvimg_20190727_093817\.jpg|/images/news/busy-studio.jpg|g' \
 -e 's|/images/updates/mugs\.jpg|/images/news/blank-mugs.jpg|g' \
 src/views/_data/news.json
```

- [ ] **Schritt 3: Prüfen**

```bash
grep -rn "images/updates" src/views
find src/images/updates -type f 2>/dev/null
```

Erwartet: beide Befehle finden nichts. Der `updates`-Eintrag in `src/admin/config.yml` bleibt bis Task 7 stehen.

- [ ] **Schritt 4: Alle fünfzehn News-Einträge haben noch ein Bild**

```bash
node -e "const n=require('./src/views/_data/news.json').news;const fs=require('fs');let bad=0;n.forEach(e=>{const p='src'+e.image.url;if(!fs.existsSync(p)){console.log('FEHLT',p);bad++}});console.log(n.length+' Eintraege, '+bad+' fehlende Dateien')"
```

Erwartet: `15 Eintraege, 0 fehlende Dateien`.

- [ ] **Schritt 5: Bauen und Manifest vergleichen**

```bash
npm run build
find dist/images -type f -exec md5sum {} + | sed 's|dist/images/||' | sort -k2 > after-task5.txt
diff <(varianten after-task4.txt) <(varianten after-task5.txt)
```

Erwartet: **keine Ausgabe.**

- [ ] **Schritt 6: Committen**

```bash
git add -A src/images src/views
git commit -m "refactor: updates/ wird news/ mit sprechenden Namen

Neun Beitragsbilder. Kameradateinamen wie mvimg_20190727_093817 und
dsc06224-cropped weichen dem, was der Alt-Text des Eintrags beschreibt.
Rollen stehen hier bewusst nicht im Namen -- News-Bilder haben keinen
festen Slot.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Werkstatt und Seitenmöbel einsortieren

Acht Werkstattbilder und zwei Dateien, die zur Seite selbst gehören. Danach ist der Wurzelordner von `src/images` leer.

**Files:**
- Create: `src/images/workshop/`, `src/images/site/`
- Move: 10 Dateien
- Modify: `src/views/about.md`, `events.md`, `home.md`, `pottery.md`, `process.md`, `retail-stores.md`, `src/views/_data/global.json`, `src/views/_includes/layouts/events-layout.njk`

**Interfaces:**
- Consumes: nichts.
- Produces: einen leeren Wurzelordner `src/images`, der in Task 8 als Nachweis dient.

| Quelle | Ziel | Grund |
|---|---|---|
| `kiln.jpg` | `workshop/kiln.jpg` | unverändert |
| `overheadwork.jpg` | `workshop/wheel-centering-plate.jpg` | Alt: "at the pottery wheel, centering a plate" |
| `pottery-in-action-2.jpg` | `workshop/throwing-a-cup-1.jpg` | Alt: "Matthew throwing a cup" |
| `pottery-in-action-3.jpg` | `workshop/throwing-a-cup-2.jpg` | Alt: identisch |
| `pottery-in-action-5.jpg` | `workshop/throwing-a-cup-3.jpg` | Alt: identisch |
| `market.jpg` | `workshop/market-booth.jpg` | Alt: "at his market booth" |
| `seymourartgallery.jpg` | `workshop/seymour-art-gallery.jpg` | Trennzeichen ergänzt |
| `blue-arrangement.jpg` | `workshop/blue-arrangement-galiano.jpg` | Alt: "Blue arrangement - Galiano" |
| `hero.jpg` | `site/hero.jpg` | Hero-Fallback aus `global.json` |
| `signature.jpg` | `site/signature.jpg` | Unterschrift im Events-Layout |

**Zur Nummerierung der drei `throwing-a-cup`-Dateien:** Alle drei tragen denselben Alt-Text, es gibt also keine inhaltliche Unterscheidung, an der man sie benennen könnte. Die Nummern halten die bisherige Reihenfolge fest. Findest du beim Ansehen der Bilder einen echten Unterschied, benenne sie danach und passe die Alt-Texte an — das ist eine Verbesserung, keine Planabweichung.

**`blue-arrangement.jpg` bleibt doppelt.** Dieselbe Datei liegt auch in `src/assets` und liefert von dort das Social-Media-Vorschaubild aus `seo.json`. Beide Fassungen sind referenziert, keine ist Totholz. `src/assets` wird nicht angefasst.

- [ ] **Schritt 1: Verschieben**

```bash
mkdir -p src/images/workshop src/images/site
git mv src/images/kiln.jpg                src/images/workshop/kiln.jpg
git mv src/images/overheadwork.jpg        src/images/workshop/wheel-centering-plate.jpg
git mv src/images/pottery-in-action-2.jpg src/images/workshop/throwing-a-cup-1.jpg
git mv src/images/pottery-in-action-3.jpg src/images/workshop/throwing-a-cup-2.jpg
git mv src/images/pottery-in-action-5.jpg src/images/workshop/throwing-a-cup-3.jpg
git mv src/images/market.jpg              src/images/workshop/market-booth.jpg
git mv src/images/seymourartgallery.jpg   src/images/workshop/seymour-art-gallery.jpg
git mv src/images/blue-arrangement.jpg    src/images/workshop/blue-arrangement-galiano.jpg
git mv src/images/hero.jpg                src/images/site/hero.jpg
git mv src/images/signature.jpg           src/images/site/signature.jpg
```

- [ ] **Schritt 2: Referenzen umschreiben**

```bash
FILES="src/views/about.md src/views/events.md src/views/home.md src/views/pottery.md src/views/process.md src/views/retail-stores.md src/views/_data/global.json"
sed -i \
 -e 's|/images/kiln\.jpg|/images/workshop/kiln.jpg|g' \
 -e 's|/images/overheadwork\.jpg|/images/workshop/wheel-centering-plate.jpg|g' \
 -e 's|/images/pottery-in-action-2\.jpg|/images/workshop/throwing-a-cup-1.jpg|g' \
 -e 's|/images/pottery-in-action-3\.jpg|/images/workshop/throwing-a-cup-2.jpg|g' \
 -e 's|/images/pottery-in-action-5\.jpg|/images/workshop/throwing-a-cup-3.jpg|g' \
 -e 's|/images/market\.jpg|/images/workshop/market-booth.jpg|g' \
 -e 's|/images/seymourartgallery\.jpg|/images/workshop/seymour-art-gallery.jpg|g' \
 -e 's|/images/blue-arrangement\.jpg|/images/workshop/blue-arrangement-galiano.jpg|g' \
 -e 's|/images/hero\.jpg|/images/site/hero.jpg|g' \
 $FILES
```

- [ ] **Schritt 3: Die Signatur im Template nachziehen**

`src/views/_includes/layouts/events-layout.njk:77` ist die einzige Stelle, an der ein Bildpfad fest im Markup steht. Ersetze:

```njk
                    {% img "images/signature.jpg", "Cheers, Matthew", "144px", "ml-auto block h-auto w-32" %}
```

durch:

```njk
                    {% img "images/site/signature.jpg", "Cheers, Matthew", "144px", "ml-auto block h-auto w-32" %}
```

Beachte: Hier fehlt der führende Schrägstrich, anders als in allen Datendateien. Der Shortcode setzt `src/` davor. Ein `sed` auf `/images/signature.jpg` würde diese Zeile **nicht** treffen.

- [ ] **Schritt 4: Prüfen, dass der Wurzelordner leer ist**

```bash
find src/images -maxdepth 1 -type f
```

Erwartet: keine Ausgabe. Alle Dateien liegen jetzt in einem der fünf Unterordner.

- [ ] **Schritt 5: Bauen und Manifest vergleichen**

```bash
npm run build
find dist/images -type f -exec md5sum {} + | sed 's|dist/images/||' | sort -k2 > after-task6.txt
diff <(varianten after-task5.txt) <(varianten after-task6.txt)
```

Erwartet: **keine Ausgabe.**

- [ ] **Schritt 6: Committen**

```bash
git add -A src/images src/views
git commit -m "refactor: Werkstattbilder nach workshop/, Seitenmoebel nach site/

Damit ist der Wurzelordner von src/images leer -- jede Datei liegt in
genau einem der fuenf Motivordner. Die fest verdrahtete Signatur im
Events-Layout ist mitgezogen.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Decap auf die neuen Ordner ausrichten

Ohne diesen Schritt zeigt Matthews Medienauswahl in jedem Feld auf einen Ordner, der nach dem Umbau leer ist. Die globale Einstellung `media_folder: "src/images"` in `src/admin/config.yml:10` bleibt stehen, greift aber nur noch als Auffangnetz — jedes der vierzehn Bildfelder bekommt eine eigene Angabe.

**Files:**
- Modify: `src/admin/config.yml` (vierzehn Felder)

**Interfaces:**
- Consumes: alle Pfade aus den Tasks 3 bis 6.
- Produces: nichts, worauf spätere Tasks aufbauen.

**Regel:** Jedes Feld zeigt auf den Ordner, in dem sein Bild tatsächlich liegt. Für das Startseiten-Hero heißt das `glazes`, nicht `site` — das Bild zeigt ein Squamish-Nights-Stück, und laut Spec gewinnt bei Motivkonflikt die Glasur. Das sieht in der Konfiguration überraschend aus und ist trotzdem richtig.

**Die Zeilennummern stammen vom Stand 2026-09-12, nach Commit `d3caa01`** und verschieben sich, sobald du das erste Feld mehrzeilig ausschreibst. Arbeite die Liste deshalb **von unten nach oben** ab, dann bleiben die Nummern der noch offenen Felder gültig.

| Zeile | Gehört zu | Feld | Zielordner |
|---|---|---|---|
| 768 | `faq.md` | `image.url` | `workshop` (Feld ist ungenutzt, siehe Schritt 3) |
| 741 | `showcase.json` | `features[].image.url` | `products` (Überschreibung existiert schon) |
| 708 | `seo.json` | `image` | **`src/assets`**, nicht `src/images` |
| 614 | `global.json` | `hero.image.url` | `site` |
| 539 | `news.json` | `news[].image.url` | `news` (Überschreibung existiert schon) |
| 446 | `privacy-statement.md` | `image.url` | `workshop` (Feld ist ungenutzt, siehe Schritt 3) |
| 414 | `retail-stores.md` | `image.url` | `workshop` |
| 338 | `process.md` | `sections[].image.url` | `workshop` |
| 308 | `pottery.md` | `sections[].image.url` | `workshop` |
| 271 | `about.md` | `sections[].image.url` | `workshop` |
| 159 | `showcase.json` | `gallery[].image.url` | `glazes` |
| 137 | `home.md` | `story_teaser.image.url` | `workshop` |
| 85 | `home.md` | `featured_piece.image.url` | `glazes` |
| 61 | `home.md` | `hero.image.url` | `glazes` |

**`events.md` taucht hier nicht auf, und das ist kein Versehen.** Die Datei hat ein `image:` im Front Matter (`src/views/events.md:24`), aber die Sammlung `Events` in der `config.yml` enthält kein Bildfeld dafür. Das Marktfoto ist also gar nicht über das CMS editierbar. Das ist eine Lücke, aber eine bestehende — sie zu schließen gehört nicht in diesen Umbau. Melde sie in Task 8 an Dan.

- [ ] **Schritt 1: Die beiden vorhandenen Überschreibungen anpassen**

Zeile 741, Produktfeld. Ersetze:

```yaml
                  - {label: "URL", name: "url", widget: "image", choose_url: false, media_folder: "/src/images/features", public_folder: "/images/features"}
```

durch:

```yaml
                  - {label: "URL", name: "url", widget: "image", choose_url: false, media_folder: "/src/images/products", public_folder: "/images/products"}
```

Zeile 539, News-Feld. Ersetze:

```yaml
                - {name: url, widget: image, media_folder: "/src/images/updates/", public_folder: "/images/updates", choose_url: false}
```

durch:

```yaml
                - {name: url, widget: image, media_folder: "/src/images/news", public_folder: "/images/news", choose_url: false}
```

Der abschließende Schrägstrich im alten News-Eintrag entfällt, damit beide Felder gleich aussehen.

- [ ] **Schritt 2: Das Social-Media-Bild auf `src/assets` festnageln**

Zeile 708. Dieses Feld füllt `seo.json:6`, und der Wert dort ist `/assets/blue-arrangement.jpg` — es zeigt also in einen **anderen Ordner als alle übrigen Felder**. Bisher erbte es das globale `src/images` und lieferte damit eine Auswahl, aus der kein gültiger Wert wählbar war. Ersetze:

```yaml
          - {label: "Social share image", name: "image", widget: "image", choose_url: false}
```

durch:

```yaml
          - {label: "Social share image", name: "image", widget: "image", choose_url: false, media_folder: "/src/assets", public_folder: "/assets"}
```

Das ist die einzige Stelle, an der dieser Umbau `src/assets` berührt, und zwar nur in der Konfiguration. Die Dateien dort bleiben unangetastet.

- [ ] **Schritt 3: Die übrigen elf Felder ausschreiben**

Jedes dieser Felder steht heute als einzeilige Kurzschreibweise da. Ersetze es durch die mehrzeilige Form mit den beiden Ordnerangaben. **Arbeite von unten nach oben**, also Zeile 768 zuerst und Zeile 61 zuletzt.

Zeile 768, `faq.md`:

```yaml
              - label: "url"
                name: "url"
                widget: "image"
                choose_url: false
                media_folder: "/src/images/workshop"
                public_folder: "/images/workshop"
```

Zeile 614, `global.json`:

```yaml
                  - label: "URL"
                    name: "url"
                    widget: "image"
                    choose_url: false
                    media_folder: "/src/images/site"
                    public_folder: "/images/site"
```

Zeile 446, `privacy-statement.md`:

```yaml
              - label: "url"
                name: "url"
                widget: "image"
                choose_url: false
                media_folder: "/src/images/workshop"
                public_folder: "/images/workshop"
```

Zeile 414, `retail-stores.md`:

```yaml
              - label: "url"
                name: "url"
                widget: "image"
                choose_url: false
                media_folder: "/src/images/workshop"
                public_folder: "/images/workshop"
```

Zeile 338, `process.md`:

```yaml
                  - label: "url"
                    name: "url"
                    widget: "image"
                    choose_url: false
                    media_folder: "/src/images/workshop"
                    public_folder: "/images/workshop"
```

Zeile 308, `pottery.md`:

```yaml
                  - label: "url"
                    name: "url"
                    widget: "image"
                    choose_url: false
                    media_folder: "/src/images/workshop"
                    public_folder: "/images/workshop"
```

Zeile 271, `about.md`:

```yaml
                  - label: "url"
                    name: "url"
                    widget: "image"
                    choose_url: false
                    media_folder: "/src/images/workshop"
                    public_folder: "/images/workshop"
```

Zeile 159, `showcase.json`, Galerie:

```yaml
                  - label: "URL"
                    name: "url"
                    widget: "image"
                    choose_url: false
                    media_folder: "/src/images/glazes"
                    public_folder: "/images/glazes"
```

Zeile 137, `home.md`, Story-Teaser:

```yaml
                  - label: "url"
                    name: "url"
                    widget: "image"
                    choose_url: false
                    media_folder: "/src/images/workshop"
                    public_folder: "/images/workshop"
```

Zeile 85, `home.md`, Featured Piece:

```yaml
                  - label: "url"
                    name: "url"
                    widget: "image"
                    choose_url: false
                    media_folder: "/src/images/glazes"
                    public_folder: "/images/glazes"
```

Zeile 61, `home.md`, Hero:

```yaml
                  - label: "url"
                    name: "url"
                    widget: "image"
                    choose_url: false
                    media_folder: "/src/images/glazes"
                    public_folder: "/images/glazes"
```

**Achte auf die Einrückung.** Sie unterscheidet sich zwischen den Feldern: Felder in verschachtelten Objekten und Listen stehen tiefer als solche direkt unter einer Datei. Übernimm die Einrückung des Bindestrichs aus der Zeile, die du ersetzt, und rücke die Folgezeilen um zwei weitere Leerzeichen ein. Die Blöcke oben sind bereits so gesetzt, wie sie an der jeweiligen Zeile stehen müssen.

**Zu `faq.md` und `privacy-statement.md`:** Beide Felder sind heute tot. Die Dateien haben keinen `image`-Schlüssel im Front Matter, und `general-layout.njk:10` rendert den Shortcode nur, wenn einer da ist. Sie bekommen trotzdem einen Ordner, damit sie im Fall einer späteren Nutzung nicht ins Leere zeigen. Ob sie ganz verschwinden sollen, ist eine Inhaltsfrage für Dan und gehört nicht in diesen Umbau — Task 8 meldet sie.

- [ ] **Schritt 4: YAML-Syntax und Vollständigkeit prüfen**

```bash
node -e "
const y=require('js-yaml'),fs=require('fs');
const c=y.load(fs.readFileSync('src/admin/config.yml','utf8'));
let n=0,ohne=[];
const walk=(f,pfad)=>{ (f||[]).forEach(x=>{
  if(x.widget==='image'){n++;if(!x.media_folder)ohne.push(pfad+'/'+(x.name||'?'))}
  if(x.fields)walk(x.fields,pfad+'/'+(x.name||x.label));
  if(x.types)walk(x.types,pfad+'/'+(x.name||x.label));
})};
c.collections.forEach(col=>{
  (col.files||[]).forEach(f=>walk(f.fields,col.name+'/'+f.name));
  if(col.fields)walk(col.fields,col.name);
});
console.log('Bildfelder gesamt: '+n);
console.log('ohne media_folder: '+ohne.length);
ohne.forEach(p=>console.log('   '+p));
"
```

Erwartet: `Bildfelder gesamt: 14` und `ohne media_folder: 0`. Wirft der Aufruf eine Ausnahme, ist die YAML-Syntax kaputt — meist eine falsche Einrückung im gerade ersetzten Block.

- [ ] **Schritt 5: Prüfen, dass kein alter Ordner mehr genannt wird**

```bash
grep -n "images/updates\|images/features" src/admin/config.yml
```

Erwartet: keine Treffer.

- [ ] **Schritt 6: Jeder Zielordner existiert und ist nicht leer**

```bash
for d in glazes products news workshop site; do
  printf "%-10s %s\n" "$d" "$(find src/images/$d -type f | wc -l)"
done
find src/assets -maxdepth 1 -type f | wc -l
```

Erwartet: `glazes 20`, `products 16`, `news 9`, `workshop 8`, `site 2`, und für `src/assets` die Zahl 21. Ein Ordner mit 0 Dateien bedeutet, dass eine frühere Task unvollständig war und Matthew dort eine leere Auswahl bekäme.

- [ ] **Schritt 7: Das CMS lokal laden**

```bash
npm run build
```

Starte danach den Dev-Server (`pottery-dev` aus `.claude/launch.json`, Port 8080) und öffne `/admin/`. Prüfe:

- Die Maske lädt und zeigt kein Fehlerbanner. Ein Banner bedeutet eine kaputte `config.yml`.
- Die Einträge **Home**, **Events**, **About**, **Global Settings** und **News & Events** öffnen sich und zeigen ihre Werte.
- Öffne einen News-Eintrag, klick das Bildfeld an: Die Auswahl zeigt die neun Dateien aus `src/images/news`.
- Öffne **Home - Gallery**, klick ein Bildfeld an: Die Auswahl ist **leer**, weil die Dateien in Unterordnern je Linie liegen. Das ist der bewusst in Kauf genommene Zustand aus der Spec, kein Fehler.

- [ ] **Schritt 8: Committen**

```bash
git add src/admin/config.yml
git commit -m "chore(cms): alle vierzehn Bildfelder auf ihren Ordner ausrichten

Decap zeigt in der Medienauswahl genau einen Ordner und kennt keine
Ordnernavigation. Ohne feldweises media_folder waere Matthews Auswahl
nach dem Umbau leer.

Das Social-Media-Bild zeigt jetzt auf src/assets, wo sein Wert
tatsaechlich liegt -- bisher erbte es src/images und bot damit eine
Auswahl ohne gueltigen Treffer.

Das Galerie-Feld zeigt auf glazes/. Laedt Matthew dort hoch, landet die
Datei flach im Wurzelordner und wird nachsortiert -- bewusst in Kauf
genommen, er hat dieses Feld seit 2021 nicht benutzt.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Abschlussprüfung

**Files:** keine Änderungen, außer der Nachprüfung aus Schritt 4.

**Interfaces:**
- Consumes: alle vorherigen Tasks.
- Produces: nichts.

- [ ] **Schritt 1: Kein alter Pfad ist übrig**

```bash
grep -rn "images/updates\|images/features\|images/new/\|carousel-" src/
```

Erwartet: keine Treffer. Der Plan und der Spec unter `docs/` nennen die alten Pfade weiterhin, das ist richtig so — sie dokumentieren den Vorher-Zustand.

- [ ] **Schritt 2: Referenzen und Bestand decken sich in beide Richtungen**

Dieser Test prüft mehr als der Build: Er erfasst auch Pfade, die nur in der `config.yml` stehen, und findet neu entstandene Karteileichen.

```bash
cat > "$M/final.py" <<'PY'
import re,os,glob
refs={}
for f in glob.glob('src/views/**/*.*',recursive=True)+glob.glob('src/admin/*.yml'):
    if not f.endswith(('.json','.md','.njk','.yml')): continue
    t=open(f,encoding='utf-8',errors='ignore').read()
    for m in re.findall(r'((?:/)?images/[A-Za-z0-9._/-]+\.(?:jpg|JPG|jpeg|png|webp))',t):
        refs.setdefault('src/'+m.lstrip('/'),[]).append(os.path.basename(f))
fehlt=[p for p in refs if not os.path.exists(p)]
platte=set(x.replace(os.sep,'/') for x in glob.glob('src/images/**/*.*',recursive=True))
verwaist=sorted(platte-set(refs))
print('Referenzen: %d, davon ohne Datei: %d' % (len(refs),len(fehlt)))
for p in fehlt: print('   FEHLT',p,'<-',refs[p])
print('Dateien: %d, davon unreferenziert: %d' % (len(platte),len(verwaist)))
for p in verwaist: print('   VERWAIST',p)
PY
python -X utf8 "$M/final.py"
```

Erwartet:

```
Referenzen: 54, davon ohne Datei: 0
Dateien: 55, davon unreferenziert: 1
   VERWAIST src/images/glazes/joffre/mug-card.jpg
```

Gezählt werden **eindeutige Dateien**, nicht Fundstellen — ein Bild, das auf zwei Seiten steht, zählt einmal. Heute sind es 56; zwei davon, `squamish-nights.jpg` und `updates/garibaldi-cropped.jpg`, verlieren im Lauf von Task 3 ihre letzte Referenz und wandern ins Archiv. Bleiben 54.

Die eine verwaiste Datei ist der beabsichtigte Vorrat aus Matthews Joffre-Foto. **Jede weitere verwaiste Datei ist ein Fehler** — dann wurde ein Bild verschoben, aber seine Referenz nicht mitgezogen, und es rutscht bei der nächsten Aufräumrunde ins Archiv.

- [ ] **Schritt 3: Der gebaute Bildbestand ist unverändert**

```bash
npm run build
find dist/images -type f -exec md5sum {} + | sed 's|dist/images/||' | sort -k2 > after-task8.txt
diff <(varianten after-task3.txt) <(varianten after-task8.txt)
wc -l < after-task8.txt
```

Erwartet: **keine Ausgabe** aus dem `diff`, und 529 Zeilen im Manifest -- 474 erzeugte Varianten plus 55 Passthrough-Kopien. Seit Task 3 wurde keine Bilddatei inhaltlich verändert, nur verschoben und umbenannt. Weicht etwas ab, hat ein Schritt eine Datei ersetzt statt verschoben.

- [ ] **Schritt 4: Die PWA-Screenshots prüfen**

```bash
grep -rn "screenshot_mobile\|screenshot_web" src/
```

Die PWA wurde in Commit `95d304e` entfernt. Finden sich nur noch Treffer in `src/assets/manifest.json` und die Manifest-Datei selbst wird von keinem Template mehr eingebunden, melde die beiden Dateien als Löschkandidaten. **Lösche sie nicht eigenmächtig** — `src/assets` ist laut Spec außer Reichweite dieses Umbaus.

Prüfe die Einbindung mit:

```bash
grep -rn "manifest" src/views/_includes/
```

- [ ] **Schritt 5: Die Seiten im Browser durchsehen**

Starte den Dev-Server und sieh dir Startseite, Sammlungen, Events, About, Process, Retail und Pottery an. Achte auf leere Bildrahmen. Der Build schlägt bei einem fehlenden Bild zwar fehl, aber ein falsch zugeordnetes Bild — etwa Jericho im Joffre-Feld — fällt nur beim Ansehen auf.

- [ ] **Schritt 6: Zusammenfassung schreiben**

Melde an Dan:

- Anzahl der verschobenen Dateien je Zielordner.
- Größe von `src/images` vorher und nachher (`du -sh src/images`).
- Ob der Manifest-Vergleich in Schritt 3 leer war.
- Die Löschkandidaten aus Schritt 4, falls welche gefunden wurden.
- Die Erinnerung, dass `_archive` durchgesehen und geleert werden will, **ohne** `_archive/originals/`.

Dazu drei Funde, die beim Umbau auffallen, aber bewusst nicht behoben werden. Melde sie, damit sie nicht verlorengehen:

- **Das Marktfoto auf der Events-Seite ist nicht über das CMS editierbar.** `src/views/events.md:24` hat ein `image:`, die Events-Sammlung in der `config.yml` aber kein passendes Feld. Matthew kann dieses Bild also nicht tauschen.
- **Zwei tote Bildfelder.** `faq.md` und `privacy-statement.md` haben je ein Bildfeld im CMS, aber keinen `image`-Schlüssel im Front Matter. `general-layout.njk:10` rendert nur, wenn einer da ist. Sie bekommen in Task 7 einen Ordner, damit sie nicht ins Leere zeigen; ob sie ganz verschwinden sollen, entscheidet Dan.
- **Achtzehn krumme Seitenverhältnisse.** Dateien mit 1.44 oder 1.48 statt sauberer 3:2. Gehört zum offenen Foto-Thema aus `2026-07-21-matthew-feedback-v2-design.md`, nicht zu diesem Umbau.

---

## Restrisiken

- **Matthew editiert währenddessen auf `main`.** Legt er einen News-Eintrag an, während Task 5 läuft, kollidiert das beim nächsten Merge in `news.json`. Sein Upload landet dann im alten `src/images`-Wurzelordner, weil die `config.yml` auf `main` bis zum Merge die alte ist. Die Korrektur ist ein `git mv` nach `src/images/news` plus ein Pfad im Eintrag.
- **`feat/tinacms-migration` wird teurer.** Dort fehlen 19 Commits; dieser Umbau vergrößert die Konfliktfläche. Bewusst in Kauf genommen.
- **`_archive` ist kein Endzustand.** Wird es nicht binnen weniger Wochen durchgesehen und geleert, ist es der nächste unklare Ordner.

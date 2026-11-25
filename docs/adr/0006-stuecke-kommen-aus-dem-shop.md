# 6. Die Stücke einer Glasur kommen aus dem Shop

Welche Stücke auf einer Glasurseite stehen, entscheidet beim Build der Shop, nicht das CMS. Zugeordnet wird über den Shopify-Tag, sortiert nach Verfügbarkeit. Das CMS behält zwei Griffe: ein Gruppenfoto je Glasur und eine Vorrangliste von Stücken.

## Kontext

Die Stücke einer Glasur wurden von Hand in „Shop sets" gepflegt: ein Feature-Stück plus bis zu vier Kacheln. Zwei Monate später, am 2026-11-25, zeigten die fünf sichtbaren Sets **15 von 20 ausverkauften Kacheln**, während im Shop **57 Stücke verfügbar** waren — allein elf Jericho. Die Kuratierung war nicht falsch angelegt, sie war abgelaufen. Bei fünf Sets.

Gleichzeitig hat Matthew Texte für alle sechzehn Glasuren geschrieben. Damit stehen sechzehn Seiten gegen sieben Sets: Elf Seiten hätten keine Stücke, obwohl der Shop für die meisten welche hat — Pemberton Earth allein zehn.

Die Daten liegen bereit. `https://shop.matthewfreed.net/collections/all/products.json` liefert in zwei Anfragen alle 200 Produkte mit Titel, Preis, Bildern, Tags und Verfügbarkeit. `soldOut.js` fragt denselben Shop beim Build schon heute, Stück für Stück, nur nach dem Ausverkauft-Zustand.

Drei Dinge sind beim Nachmessen aufgefallen und haben die Entscheidungen geprägt:

- **Die Reihenfolge des Shops ist alphabetisch**, nicht kuratiert: Angle Tray, Belly Mug, Berry Bowl. Wer sie übernimmt, erbt keine Auswahl, sondern das Alphabet.
- **`published_at` ist das Anlagedatum im Shop, nicht der Brand.** Die Jericho-Produkte stammen aus 2020 bis 2026. „Neueste zuerst" liefert zwei Stücke von Februar 2026, beide vergriffen. Der Shop ist ein Katalog der Formen, kein Verzeichnis dessen, was gerade da ist — das einzige Signal für „gerade da" ist die Verfügbarkeit.
- **Das „Feature piece" war nie ein Stück.** Alle sechs vorhandenen heißen „Jericho tea set", „Tofino tea set and vase", „Yaletown at the market", haben keinen Preis, und ihre Dateien enden auf `-feature.jpg`. Es ist ein Gruppenfoto, das im Shop-Set steckte.

## Entscheidung

- **Zuordnung allein über den Shopify-Tag.** Kein Rückfall auf den Produkttitel, keine Warnung im Build. Damit ist der Tag die tragende Angabe, und seine Lücken sind ein Fall für den Shop, nicht für den Code — siehe `docs/feature/0006-shop-tags-aufraeumen.md`.
- **Reihenfolge: verfügbare Stücke zuerst, dann die zuletzt angelegten.** Ausverkauftes wird nicht versteckt, aber es wird nicht vorgezogen. Ohne dieses Kriterium bestünden zwei Drittel der 64 Kacheln aus Nicht-Käuflichem, unter einer Überschrift, die „From the current firing" heißt.
- **Shop-Sets werden zur Vorrangliste.** Vom Set bleiben der Glasurname und die Stücke; steht dort etwas, kommt es zuerst, der Shop füllt auf. Das Feature-Stück entfällt.
- **Das Gruppenfoto gehört der Glasur**, nicht dem Set: Es hängt an der Glasur und nicht an einer Auswahl, die sich ändert, und Skaha soll eines haben können, ohne ein Stück im Shop zu haben. Solange keines da ist, steht links das Kartenbild der Glasur — damit hat jede Seite dieselbe Form und immer ein Bild.
- **Die Startseite wird derselbe Block.** „From the current firing" würfelt künftig eine Glasur und zeigt deren Gruppenfoto und deren Stücke. Ein Schalter an der Glasur hält sie aus der Rotation, so wie heute „Hide these pieces" am Set.
- **Shop-Antworten und Bilder werden in `.cache` zwischengespeichert**, über das bereits vorhandene `@11ty/eleventy-fetch`. Antwortet der Shop nicht, gilt der letzte gute Stand. Eine `netlify.toml` sichert den Ordner zwischen den Deploys; der Build-Befehl bleibt in der Netlify-Oberfläche, damit nicht zwei Orte dasselbe bestimmen.

## Konsequenzen

- **Die Pflege verschiebt sich vom CMS in den Shop.** Was Matthew im Shop tut, steht auf der Website. Das ist der Zweck — und es heißt auch, dass ein falscher Tag dort jetzt auf der Website sichtbar wird. Heute liegt „Shorty Mug - Squamish Night" unter `Garibaldi`.
- **Die Seite ist weniger vorhersehbar.** Verkauft sich ein Stück, zeigt der nächste Build andere Kacheln. Ein Screenshot von heute gilt morgen nicht mehr — auch nicht der in einer Mail an Matthew.
- **Die Bauzeit sinkt deutlich, nachdem sie einmal gestiegen ist.** Heute kostet ein Deploy 207 Sekunden, fast alles Bildrechnen: 82 Quellbilder werden zu 903 Ableitungen, und `clean` löscht sie vor jedem Build. Mit dem Cache rechnet nur noch, was neu ist. Der erste Build nach einem geleerten Cache dauert wieder voll.
- **Verwaiste Ableitungen sammeln sich.** Ein ausgetauschtes Foto bekommt einen neuen Hash; die alten siebzehn Dateien bleiben im Cache. Einmal jährlich leeren genügt.
- **Die Messung bekommt einen Bruch.** Die Platzierungen heißen weiter `firing-<name>-tileN`, und weil die Sets nach ihren Glasuren benannt waren, bleiben zehn Namen gleich. Weg fällt `firing-oil-dispensers-*`, neu kommen Glasuren ohne bisheriges Set. Das Umstelldatum gehört in die Auswertung, sonst ist später nicht trennbar, was Umbau war und was Weihnachtsgeschäft.
- **Vier Glasuren bleiben ohne Kacheln:** Skaha, Galiano, Dogwood und Saltspring haben nichts im Shop. Für sie trägt das blaue Band die Seite, und das ist die ehrliche Auskunft.
- **Der Shop wird zur Abhängigkeit des Builds.** Bisher kostete ein Ausfall ein Etikett, künftig die Kacheln. Der Cache deckt den Normalfall ab, nicht den ersten Build nach dem Leeren.

# Feature: Täglicher Neubau für das Sold-out-Label

> **Status: für später, nicht Teil der Tina-Migration.** Das Label funktioniert (seit 2026-09-18): Es wird beim Build aus dem Shop gelesen. Dieses Dokument hält fest, was nötig ist, damit es aktuell bleibt, wenn niemand etwas im CMS speichert.

## Problemstellung (Problem Statement)

Auf der Startseite zeigt jedes Shop-Set bis zu vier Shop-Artikel. Ist ein Artikel im Shop ausverkauft, trägt seine Kachel das Label „Sold out". Ob ein Artikel ausverkauft ist, fragt die Website beim Build den Shop (shop.matthewfreed.net). Im Browser geht das nicht, denn der Shop erlaubt keine Abfragen von fremden Seiten.

Die Website wird aber nur gebaut, wenn Matthew im CMS speichert oder Dan etwas veröffentlicht. Pflegt eine Woche lang niemand etwas, bleibt das Label eine Woche alt:

- Ein inzwischen verkauftes Stück steht ohne Label da. Ein Besucher klickt, landet im Shop auf „Sold out" und ist enttäuscht.
- Ein nachgetöpfertes Stück trägt noch „Sold out". Der Besucher klickt gar nicht erst, und Matthew verliert einen Verkauf.

Gerade in der Marktsaison verkauft Matthew viel und pflegt wenig: Dann weicht das Label am stärksten ab.

## Lösung (Solution)

Die Website wird einmal am Tag automatisch neu gebaut, auch wenn niemand etwas geändert hat. Das Label ist damit höchstens einen Tag alt. Matthew und Dan müssen dafür nichts tun.

Optional baut der tägliche Lauf nur dann neu, wenn sich die Verfügbarkeit eines gezeigten Artikels seit dem letzten Deploy geändert hat. So kostet ein ruhiger Tag keine Build-Minuten.

Antwortet der Shop beim Build nicht, bekommt kein Artikel ein Label. Der Build läuft trotzdem durch, die Seite bleibt online (so ist es heute schon).

## User Stories

1. Als Besucher möchte ich an einer Kachel sehen, dass ein Stück ausverkauft ist, um nicht vergeblich in den Shop zu klicken.
2. Als Besucher möchte ich, dass ein wieder vorrätiges Stück kein „Sold out" mehr trägt, um es nicht zu übersehen.
3. Als Matthew möchte ich, dass das Label dem Shop folgt, ohne dass ich im CMS etwas speichern muss, um mich nach einem Markt nicht um die Website kümmern zu müssen.
4. Als Matthew möchte ich ein Stück im Shop nachbestücken und am nächsten Tag ohne Label auf der Startseite sehen, um es wieder verkaufen zu können.
5. Als Matthew möchte ich, dass ein Ausfall des Shops die Website nicht lahmlegt, um mir darüber keine Gedanken machen zu müssen.
6. Als Dan möchte ich die Uhrzeit des täglichen Laufs festlegen, um ihn in eine ruhige Zeit zu legen, etwa nachts in Vancouver.
7. Als Dan möchte ich den täglichen Lauf abschalten können, ohne Code zu ändern, um ihn etwa bei knappen Build-Minuten zu pausieren.
8. Als Dan möchte ich im Netlify-Dashboard erkennen, welcher Deploy vom täglichen Lauf stammt, um ihn von Matthews Änderungen zu unterscheiden.
9. Als Dan möchte ich, dass ein fehlgeschlagener täglicher Lauf die Live-Seite nicht verändert, um keinen halben Stand auszuliefern.
10. Als Dan möchte ich erfahren, wenn der tägliche Lauf mehrere Tage hintereinander scheitert, um das Label nicht unbemerkt veralten zu lassen.
11. Als Dan möchte ich, dass der tägliche Lauf nur den Live-Stand (`main`) baut, um keine Vorschau-Branches mitzubauen.
12. Als Dan möchte ich die monatlichen Build-Minuten abschätzen können, um Netlifys Kontingent nicht zu überschreiten.
13. Als Dan möchte ich, dass kein Geheimnis (Build-Hook-Adresse, Token) im Repository steht, um niemandem Deploys auslösen zu lassen.
14. Als Dan möchte ich auf Wunsch nur bei geänderter Verfügbarkeit neu bauen, um an ruhigen Tagen keine Build-Minuten zu verbrauchen.
15. Als Dan möchte ich, dass versteckte Shop-Sets bei dieser Prüfung nicht mitzählen, um nicht wegen Stücken neu zu bauen, die niemand sieht.
16. Als Matthew möchte ich, dass ein täglicher Build meine gerade laufende Bearbeitung im CMS nicht stört, um nichts zu verlieren.

## Implementierungs-Entscheidungen (Implementation Decisions)

- **Auslöser: Netlify Build Hook.** Ein Build Hook für `main` wird im Netlify-Dashboard angelegt. Seine Adresse ist ein Geheimnis und liegt nur beim Zeitplaner.
- **Zeitplaner: offen, zwei Kandidaten.**
  - *GitHub Actions mit `schedule`:* ein Workflow, der einmal am Tag den Build Hook aufruft. Einfach, kostet nichts, die Hook-Adresse liegt als Repository-Secret. Abschalten geht über „Disable workflow" in GitHub. GitHub verzögert geplante Läufe bei Last und pausiert sie nach 60 Tagen ohne Aktivität im Repository.
  - *Netlify Scheduled Function:* läuft bei Netlify selbst, ohne GitHub-Abhängigkeit. Braucht einen Functions-Ordner und die Hook-Adresse als Umgebungsvariable.
  - Empfehlung für den Anfang: GitHub Actions, weil nichts an der Website selbst dazukommt.
- **Optional: nur bei Änderung bauen.** Der Build veröffentlicht die ermittelte Verfügbarkeit als kleine Datei neben der Website. Der tägliche Lauf fragt den Shop selbst, vergleicht mit dieser Datei und ruft den Build Hook nur bei einer Abweichung auf. Die Prüflogik (Links sammeln, Shop fragen, weich scheitern) gibt es schon im Datenmodul für das Label; der Lauf sollte sie wiederverwenden, statt sie zu kopieren.
- **Weiches Scheitern bleibt:** Antwortet der Shop nicht oder langsam (Zeitlimit je Artikel), bekommt der Artikel kein Label. Ein Build scheitert nie am Shop.
- **Deploy-Kennzeichnung:** Der Build-Hook-Aufruf gibt einen Titel mit (Netlify zeigt ihn am Deploy), etwa „Täglicher Neubau (Sold-out-Label)".
- **Laufzeit:** Ein Build umfasst `tinacms build` und alle Bildgrößen. Die Dauer eines Builds auf `main` vorher messen; ein täglicher Build sind rund 30 Builds im Monat.
- **Zusammenspiel mit dem CMS:** Der Build Hook baut den aktuellen Stand von `main`. Ungespeicherte Änderungen im CMS sind davon nicht betroffen; ein gleichzeitiger Speicher-Commit löst ohnehin einen eigenen Build aus.

## Test-Entscheidungen (Testing Decisions)

- Ein guter Test prüft nur das sichtbare Verhalten: welche Artikel als ausverkauft gelten, bei welchen Shop-Antworten, und ob ein Vergleich eine Änderung meldet. Nicht, wie oft oder in welcher Reihenfolge der Shop gefragt wird.
- **Bestehende Nahtstelle:** Das Datenmodul für das Label nimmt eine austauschbare `fetch`-Funktion entgegen und ist so schon getestet (vier Tests: ausverkauft, vorrätig, Shop nicht erreichbar, Nicht-Produkt-Links). Der optionale Vergleich „hat sich etwas geändert" gehört an dieselbe Nahtstelle: alter Stand und Shop-Antworten rein, ja/nein raus.
- **Nicht automatisiert testbar:** der Zeitplan selbst und der Build-Hook-Aufruf. Einmal von Hand auslösen („Run workflow" bzw. Funktion manuell starten) und im Netlify-Dashboard den Deploy mit dem gesetzten Titel prüfen.
- Die Nahtstellen sind ein Vorschlag und mit Dan abzustimmen, bevor die Arbeit beginnt.

## Nicht im Leistungsumfang (Out of Scope)

- Verfügbarkeit im Browser live abfragen: Der Shop sendet keine CORS-Freigabe, das geht nur über einen eigenen Proxy (etwa eine Netlify Function) und wäre ein eigenes Feature.
- Preise automatisch aus dem Shop übernehmen. Die Preise stehen im CMS; vor einem Release prüft sie das Skript für den Shop-Abgleich.
- Ausverkaufte Artikel automatisch ausblenden oder ersetzen. Das Label zeigt den Zustand; welche Stücke gezeigt werden, entscheidet Matthew.
- Benachrichtigungen an Matthew.

## Weitere Anmerkungen (Further Notes)

- Stand am 2026-09-18: 9 der 24 Artikel in den Shop-Sets sind ausverkauft, davon 4 im versteckten Set Strathcona.
- Für den Abgleich vor einem Release gibt es das Skript `scripts/shop-check.mjs` (Übersicht mit Bildern, Titeln, Preisen und Verfügbarkeit). Es ersetzt den täglichen Neubau nicht, zeigt aber, wie weit Label und Shop gerade auseinanderliegen.
- Kontingent prüfen: Netlifys Build-Minuten im aktuellen Tarif gegen rund 30 zusätzliche Builds im Monat. Am 2026-09-18 war schon die Hälfte des Kontingents für 28.08.–28.09. verbraucht (viele Vorschau-Builds während der Migration). Das spricht für die Variante „nur bei Änderung bauen“.

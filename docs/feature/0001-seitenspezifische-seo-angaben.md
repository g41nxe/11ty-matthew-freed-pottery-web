# Feature: Seitenspezifische SEO-Angaben

> **Status: Idee, nicht geplant.** Für jetzt gilt ADR 0002 — nur globale SEO-Angaben. Dieses Dokument hält fest, was eine spätere Umsetzung braucht, damit Befunde und Texte aus der Analyse vom 2026-09-13 nicht verlorengehen.

## Problemstellung (Problem Statement)

Wird eine Seite der Website geteilt — per WhatsApp, Facebook, in einer Nachricht — erscheint immer dasselbe Vorschaubild und dieselbe Beschreibung, egal ob es die Sammlungsseite, die Events oder die Kontaktseite ist. Nur der Titel unterscheidet sich. Wer die Events-Seite teilt, um auf einen Markt hinzuweisen, zeigt ein Bild von blauen Schalen und einen allgemeinen Satz über das Studio.

Matthew kann das nicht ändern, denn das CMS bietet dafür kein Feld.

## Lösung (Solution)

Jede Seite bekommt im CMS einen optionalen Bereich „Beim Teilen". Dort kann Matthew eine eigene Beschreibung und ein eigenes Vorschaubild setzen. Lässt er beides leer, gilt wie bisher der globale Eintrag. Die Seite verhält sich also ohne Zutun genau wie heute.

## User Stories

1. Als Matthew möchte ich für eine Seite eine eigene Teilen-Beschreibung eingeben, um beim Teilen der Seite zu sagen, worum es dort geht.
2. Als Matthew möchte ich für eine Seite ein eigenes Vorschaubild auswählen, um beim Teilen ein passendes Motiv zu zeigen.
3. Als Matthew möchte ich die Felder leer lassen können, um nicht für jede Seite etwas pflegen zu müssen.
4. Als Matthew möchte ich sehen, welche Angabe greift, wenn ich nichts eintrage, um nicht zu raten, wie die Seite beim Teilen aussieht.
5. Als Matthew möchte ich beim Schreiben der Beschreibung einen Hinweis auf die sinnvolle Länge sehen, um nicht abgeschnitten zu werden.
6. Als Matthew möchte ich das Vorschaubild aus denselben Bildordnern wählen wie die übrigen Bilder, um keine Datei doppelt hochladen zu müssen.
7. Als Matthew möchte ich eine gesetzte Angabe wieder entfernen können, um zum globalen Standard zurückzukehren.
8. Als Besucher, der einen geteilten Link erhält, möchte ich eine Vorschau sehen, die zur geteilten Seite passt, um zu erkennen, worauf der Link führt.
9. Als Besucher möchte ich immer ein Vorschaubild sehen, auch wenn die Seite kein eigenes hat, um keine leere Karte zu bekommen.
10. Als Suchmaschine möchte ich je Seite eine eigene Beschreibung lesen, um die Seite im Suchergebnis passend zusammenzufassen.
11. Als Dan möchte ich, dass kein Inhaltsfeld einer Seite versehentlich als SEO-Angabe ausgewertet wird, um Fehler wie das `[object Object]` auf der Händlerseite strukturell auszuschließen.
12. Als Dan möchte ich, dass jedes Vorschaubild als absolute Adresse ausgegeben wird, um sicherzugehen, dass soziale Netzwerke es laden können.
13. Als Dan möchte ich die SEO-Angaben einer Seite an genau einer Stelle im Front Matter finden, um sie beim Lesen einer Datei nicht zwischen Inhaltsfeldern suchen zu müssen.

## Implementierungs-Entscheidungen (Implementation Decisions)

- **Eigener Namensraum statt fester Plugin-Schlüssel.** `eleventy-plugin-seo` liest `image`, `excerpt`, `author` und `ogtype` auf oberster Ebene des Front Matters. Diese Namen kollidieren mit Inhaltsfeldern, wie die Händlerseite zeigt. Die Angaben gehören stattdessen in ein Objekt `seo` je Seite, mit den Unterfeldern `description` und `image`. Vorschlag, bei Umsetzung zu bestätigen.
- **Konsequenz daraus: Meta-Tags nicht mehr über das Plugin.** Weil das Plugin den Namensraum nicht kennt, werden Open-Graph- und Twitter-Tags über ein eigenes Partial im Basis-Layout erzeugt, das zuerst `seo` der Seite, dann den globalen Eintrag liest. Alternative: das Plugin behalten und die reservierten Namen per Konvention freihalten. Die Alternative ist kleiner, verhindert die Kollision aber nicht, sondern verbietet sie nur.
- **Tina-Schema.** Jede Seiten-Sammlung erhält ein optionales Objekt `seo` mit einem Textfeld für die Beschreibung und einem Bildfeld über den globalen Medien-Stamm. Keines der Felder ist Pflicht.
- **Rückfall.** Leeres oder fehlendes Feld bedeutet: globaler Wert. Ein leerer String zählt als leer. Nunjucks' `default` greift ohne dritten Parameter nur bei `undefined`, deshalb überall `default(x, true)`.
- **Absolute Bildadresse.** Jedes ausgegebene Vorschaubild wird mit der Website-Adresse aus `seo.json` zusammengesetzt, unabhängig davon, ob es von der Seite oder global kommt.
- **Bildgröße.** Vorschaubilder brauchen ein Querformat um 1200 × 630 Pixel. Ob dafür eine eigene Variante aus dem Bild-Shortcode erzeugt wird oder das Original genügt, ist bei Umsetzung zu klären.

## Test-Entscheidungen (Testing Decisions)

Das Repo hat kein Test-Framework. Getestet wird über die höchste vorhandene Nahtstelle: **das gebaute HTML**. Genau so wurden bereits der Bildumbau und das Feedback zu v2 verifiziert — Build ausführen, dann das Ergebnis in `dist` prüfen.

- **Gutes Testverhalten:** Geprüft wird nur, was im ausgelieferten `<head>` steht, nicht wie es entsteht. Ob die Tags vom Plugin oder einem eigenen Partial kommen, darf den Test nicht ändern.
- **Nahtstelle 1, Meta-Tags je Seite im gebauten HTML.** Für jede Seite: Eine Seite ohne eigene Angaben liefert Beschreibung und Bild des globalen Eintrags. Eine Seite mit eigenen Angaben liefert diese. Jedes `og:image` und `twitter:image` beginnt mit `https://`. Kein Meta-Tag enthält `[object Object]`.
- **Nahtstelle 2, Speichern im CMS.** Eine SEO-Angabe in Tina setzen, speichern, und prüfen, dass der Commit ausschließlich das Objekt `seo` dieser Seite ändert. Das ist derselbe Rundlauf-Test, den der Tina-Migrationsplan für jede Sammlung vorsieht.
- **Regressionsschutz.** Ein Suchlauf über `dist` nach `[object Object]` in Meta-Tags und nach relativen `og:image`-Werten. Dieser Befund war 2026-09-13 auf der Händlerseite und global vorhanden.

## Nicht im Leistungsumfang (Out of Scope)

- Seitenspezifische Titel. Die Seiten haben bereits eigene Titel, die das Plugin auswertet.
- Eigene Teilen-Angaben für einzelne Events, News-Beiträge oder Glasurlinien.
- Strukturierte Daten nach schema.org, etwa für Veranstaltungen oder Produkte.
- Automatisch erzeugte Vorschaubilder mit Text.
- Die Korrektur des relativen globalen Vorschaubilds und der Namenskollision auf der Händlerseite. Beides wird unabhängig von diesem Feature unter ADR 0002 behoben.

## Weitere Anmerkungen (Further Notes)

- **Verlorene Beschreibung der Sammlungsseite.** Diese Seite hatte bis zum Aufräumen eine eigene Beschreibung. Der Text, falls er wieder gebraucht wird: *„Explore my different glazing lines and pottery forms. Each piece is a complexity of nature, science, and art."*
- **Vorschaubild der Kontaktseite.** Die Kontaktseite verwies auf `/images/uploads/contact.jpeg`. Die Datei existiert in keinem Branch, das Vorschaubild war also bereits kaputt, bevor es entfernt wurde.
- **Herkunft der gegensätzlichen Stände.** `feat/site-redesign-v2` entfernte die Seitenüberschreibungen in Commit `b5f177b`, `feat/tinacms-migration` stellte sie in Commit `9804975` wieder her. ADR 0002 entscheidet für den Stand von v2.
- **Nutzerzahl.** TinaCloud im kostenlosen Tarif erlaubt zwei Nutzer (ADR 0001). Das Feature ändert daran nichts.

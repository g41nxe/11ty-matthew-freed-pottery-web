# Feature: Schriften und Karte ohne Google beim Seitenaufruf

> **Status: umgesetzt auf Branch `feat/ohne-google`** (Plan `docs/superpowers/plans/2026-09-19-ohne-google-beim-seitenaufruf.md`), gestapelt auf die Messung. Entstanden bei der Recherche zur cookiefreien Messung (Spec `2026-09-17-klicks-und-verkaeufe-design.md`). Geprüft am 2026-09-19: Die Website lädt heute auf jeder Seite Schriften von Google Fonts, und auf der Kontaktseite eine Google-Maps-Karte und Googles reCAPTCHA (von Netlify ins Kontaktformular eingesetzt). **reCAPTCHA bleibt** (Entscheidung Dan, 2026-09-19); dieses Ticket betrifft nur Schriften und Karte.

## Problemstellung (Problem Statement)

Wer die Website öffnet, schickt seine IP-Adresse an Google, bevor er etwas angeklickt hat: Die beiden Schriften Fraunces und Karla kommen von Google Fonts. Auf der Kontaktseite lädt zusätzlich die eingebettete Karte, und sie darf Google-Cookies setzen.

Nach kanadischem Recht genügt es, das in der Datenschutzerklärung offenzulegen. Verkauft Matthew aber an Kunden in der EU, gilt eine strengere Lesart: Eingebettete Dienste, die Cookies setzen, brauchen dann eine Einwilligung (EuGH, *Fashion ID*, 2019), und das Laden von Google Fonts ohne Einwilligung hat ein deutsches Gericht für unzulässig erklärt (LG München I, 2022).

Dazu kommt: Die Datenschutzerklärung muss jeden dieser Dienste einzeln erklären, und die zusätzlichen Verbindungen zu Google verlangsamen den ersten Seitenaufbau.

## Lösung (Solution)

Die Schriften liegen auf dem eigenen Server und sehen genauso aus wie heute; keine Seite spricht beim Aufruf mehr Google Fonts an.

Auf der Kontaktseite ersetzt ein Kartenbild der Umgebung die eingebettete Google-Karte. Das Bild stammt aus OpenStreetMap, liegt auf dem eigenen Server, markiert das Studio und ist farblich an die Seite angepasst. Das ganze Bild ist ein Link zu Google Maps (neuer Tab); ein kleines Label unten links, „Directions on Google Maps“, benennt ihn, ist auch auf dem Telefon sichtbar und wird beim Überfahren blau (Entscheidung Dan, 2026-09-19). Google Maps wird nicht mehr eingebettet, es braucht also weder einen Hinweis noch eine Einwilligung (Entscheidung Dan, 2026-09-19).

Das Kontaktformular behält Googles reCAPTCHA als Spamschutz. Die Kontaktseite spricht damit beim Aufruf weiterhin einen Google-Dienst an; alle anderen Seiten nicht mehr.

Die Datenschutzerklärung schrumpft entsprechend auf einen Absatz zu reCAPTCHA im Kontaktformular. Dazu kommt ein Satz, dass die Karte ein Bild auf dem eigenen Server ist und Google Maps nur über einen Link erreicht wird.

## User Stories

1. Als Besucher möchte ich, dass beim Öffnen der Website keine Daten an Google Fonts gehen, um nicht ungefragt verfolgt zu werden.
2. Als Besucher möchte ich die Schriften genauso sehen wie bisher, um keinen Unterschied im Erscheinungsbild zu bemerken.
3. Als Besucher mit langsamer Verbindung möchte ich, dass die Seite schneller steht, weil keine Verbindung zu weiteren Servern aufgebaut werden muss.
4. Als Besucher möchte ich, dass Text sofort lesbar ist, auch bevor die Schrift geladen ist, um nicht auf leere Flächen zu schauen.
5. Als Besucher der Kontaktseite möchte ich sofort sehen, wo das Studio liegt, ohne dass ein fremder Kartendienst laden muss.
6. Als Besucher der Kontaktseite möchte ich mit einem Klick zu Google Maps wechseln können, um den Weg zum Studio zu planen.
7. Als Besucher möchte ich am Linktext erkennen, dass er mich zu einer Wegbeschreibung führt, um nicht überrascht zu werden.
8. Als Besucher auf dem Telefon möchte ich, dass sich der Link in meiner Karten-App oder im Browser öffnet, um die Route direkt zu starten.
9. Als Besucher ohne JavaScript möchte ich Kartenbild und Link genauso nutzen können.
10. Als Besucher auf dem Telefon möchte ich, dass das Kartenbild die Breite des Bildschirms nutzt und nichts seitlich überläuft.
11. Als Matthew möchte ich, dass das Kontaktformular unverändert funktioniert und weiterhin durch reCAPTCHA vor Spam geschützt ist, um keine Anfrage zu verlieren und nicht aussortieren zu müssen.
12. Als Matthew möchte ich den Linktext im CMS ändern können, um den Ton selbst zu bestimmen.
13. Als Matthew möchte ich, dass der Link zu Google Maps aus der Studio-Adresse in den Einstellungen entsteht, damit ich nach einem Umzug nur eine Stelle pflegen muss, und dass danach nie ein Bild vom alten Ort erscheint.
14. Als Matthew möchte ich eine kürzere, verständliche Datenschutzerklärung, um sie selbst verantworten zu können.
15. Als Dan möchte ich die Lizenzen der Schriften mit ausliefern und OpenStreetMap als Quelle der Kartendaten nennen, um die Bedingungen der SIL Open Font License und der ODbL einzuhalten.
16. Als Dan möchte ich prüfen können, dass keine Seite beim Aufruf Google Fonts oder Google Maps anspricht, um Rückfälle zu bemerken.
17. Als Dan möchte ich, dass die cookiefreie Messung mit Umami davon unberührt bleibt.
18. Als Dan möchte ich das Kartenbild nach einem Umzug mit einem Befehl neu erzeugen können.

## Implementierungs-Entscheidungen (Implementation Decisions)

- **Schriften selbst hosten.** Fraunces als variable Schrift mit der Achse für optische Größe und den Gewichten 500 und 900, Karla mit 400, 500 und 700, jeweils als WOFF2 im lateinischen Teilsatz, mit der Lizenzdatei daneben. Die Schriften liegen bei den übrigen statischen Dateien der Website. Das Stylesheet bekommt eigene `@font-face`-Regeln mit `font-display: swap`; die Theme-Variablen für die beiden Schriftfamilien bleiben, wie sie sind. Die beiden wichtigsten Dateien werden im Basis-Layout vorgeladen, die Verweise auf Google Fonts entfallen.
- **Kartenbild statt eingebetteter Karte.** Die Kontaktseite zeigt ein Kartenbild der Umgebung mit markiertem Studio; das ganze Bild ist der Link zu Google Maps, benannt durch ein Label auf dem Bild. Fehlt das Bild (nach einem Umzug), steht stattdessen ein Textlink da. Beides funktioniert ohne JavaScript, ein Skript gibt es nicht.
- **Kartenbild aus OpenStreetMap, nicht von Google.** Googles Bedingungen verbieten, Kartenbilder zu speichern, und ein live geladenes Google-Bild würde beim Aufruf wieder Google ansprechen. Das Bild entsteht einmal per Skript aus OpenStreetMap-Kacheln, mit der Quellenangabe „© OpenStreetMap contributors" auf dem Bild, und liegt bei den übrigen Bildern. Das Skript läuft von Hand, nie im Build, und schont damit die Server von OpenStreetMap. Nach einem Umzug wird es neu gestartet. Bis dahin zeigt die Seite kein Bild statt eines falschen Ortes: Das Skript merkt sich, für welche Adresse es das Bild erzeugt hat.
- **Google Maps nur als Link.** Der Link entsteht wie auf der Events- und der Händlerseite aus der Studio-Adresse und nutzt das eigene Label `map_link` aus den Einstellungen („Directions on Google Maps“). Der Google-Maps-API-Schlüssel wird nicht mehr gebraucht; die Website liest ihn nicht mehr.
- **reCAPTCHA bleibt unverändert** (Entscheidung Dan, 2026-09-19). Das Kontaktformular, sein Honeypot-Feld und das von Netlify eingesetzte reCAPTCHA werden nicht angefasst.
- **Datenschutzerklärung.** Der Absatz über Google-Dienste schrumpft auf reCAPTCHA: Das Kontaktformular ist durch Google reCAPTCHA geschützt, das beim Aufruf der Kontaktseite lädt und Google-Cookies setzen darf; es gilt Googles Datenschutzerklärung. Dazu ein Satz zur Karte: ein Bild auf diesem Server, Kartendaten von OpenStreetMap, Google Maps nur über den Link.
- **Die Messung bleibt unberührt.** Umami lädt weiterhin nur mit gesetzter Website-ID und setzt keine Cookies. Klicks auf den Link zu Google Maps zählt es wie bisher als `directions`.

## Test-Entscheidungen (Testing Decisions)

- **Gute Tests prüfen, was der Besucher erlebt,** nicht wie es gebaut ist: welche Server eine Seite beim Aufruf anspricht, wohin der Link führt, ob das Formular ankommt.
- **Wächter über die Quellen:** Kein Template, kein Inhalt und kein Stylesheet verweist auf `fonts.googleapis.com`, `fonts.gstatic.com`, `google.com/maps/embed` oder `maps.googleapis.com`. Jede im Stylesheet deklarierte Schrift liegt mit ihrer Lizenz im Repo. reCAPTCHA taucht in den Quellen nicht auf, weil Netlify es erst beim Deploy einsetzt.
- **Kartenbild:** Die Umrechnung von Koordinaten in Kartenkacheln ist ein reiner Rechenschritt und wird mit festen Werten getestet. Ein Test meldet, wenn die Studio-Adresse in den Einstellungen nicht mehr die ist, für die das Bild erzeugt wurde. Er erinnert daran, das Skript neu zu starten.
- **Die gebaute Website:** Vorbild ist der vorhandene HTML-Vergleich zweier Builds. Ein Vergleich vor und nach dem Umbau zeigt, dass sich außer Kopfbereich, Kartenbereich und Datenschutzabsatz nichts geändert hat.
- **Im Browser, auf der Deploy-Vorschau:** Beim Aufruf der Startseite zeigt das Netzwerkprotokoll keine Anfrage an einen Google-Server. Auf der Kontaktseite erscheinen nur die Anfragen von reCAPTCHA, keine von Google Fonts oder Google Maps. Das Kartenbild kommt vom eigenen Server, und Bild wie Link öffnen Google Maps.
- **Erscheinungsbild:** Überschriften und Fließtext der Startseite vorher und nachher bei Desktop- und Telefonbreite vergleichen; Schriftart, Stärke und optische Größe müssen übereinstimmen.
- **Formular:** Eine Testnachricht auf der Deploy-Vorschau kommt in Netlify an, reCAPTCHA erscheint wie bisher.

## Nicht im Leistungsumfang (Out of Scope)

- Ausbau oder Umbau von reCAPTCHA (Entscheidung 2026-09-19).
- Ein Cookie-Banner oder eine Einwilligungsverwaltung.
- Eine interaktive Karte, ob von Google oder von OpenStreetMap. Eine live eingebettete OSM-Karte würde beim Aufruf die Server der OpenStreetMap Foundation ansprechen (Entscheidung 2026-09-19).
- Der Shopify-Shop mit seinen eigenen Cookies und seiner eigenen Datenschutzerklärung.
- Die cookiefreie Messung mit Umami.
- Andere Schriften oder eine Änderung des Designs.
- Den Google-Maps-API-Schlüssel in Netlify löschen; das macht Dan nach dem Release.

## Weitere Anmerkungen (Further Notes)

- Die rechtliche Einordnung ist eine Recherche, keine Rechtsberatung. Ob EU-Recht überhaupt greift, hängt davon ab, ob Matthew gezielt an Kunden in der EU verkauft (Versand, Preise in Euro); die bloße Erreichbarkeit der Website genügt nicht.
- Mit reCAPTCHA setzt die Kontaktseite weiterhin Google-Cookies beim Aufruf. Unter der strengen EU-Lesart bliebe das die eine Stelle, die eine Einwilligung bräuchte. Falls das je relevant wird, wäre der kleinste Schritt, reCAPTCHA erst beim ersten Tippen ins Formular zu laden, statt es auszubauen.
- Die heutige Datenschutzerklärung nennt die drei Google-Dienste, damit sie bis zu diesem Umbau stimmt. Nach dem Umbau muss sie angepasst werden, sonst beschreibt sie Dienste, die nicht mehr beim Aufruf laden.
- Nebeneffekt: Ohne die Verbindungen zu Google Fonts steht die Seite schneller, besonders auf dem Telefon.

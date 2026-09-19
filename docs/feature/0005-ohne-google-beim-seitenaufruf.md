# Feature: Schriften und Karte ohne Google beim Seitenaufruf

> **Status: für später, nicht Teil der Messung.** Entstanden bei der Recherche zur cookiefreien Messung (Spec `2026-09-17-klicks-und-verkaeufe-design.md`). Geprüft am 2026-09-19: Die Website lädt heute auf jeder Seite Schriften von Google Fonts, und auf der Kontaktseite eine Google-Maps-Karte und Googles reCAPTCHA (von Netlify ins Kontaktformular eingesetzt). **reCAPTCHA bleibt** (Entscheidung Dan, 2026-09-19); dieses Ticket betrifft nur Schriften und Karte.

## Problemstellung (Problem Statement)

Wer die Website öffnet, schickt seine IP-Adresse an Google, bevor er etwas angeklickt hat: Die beiden Schriften Fraunces und Karla kommen von Google Fonts. Auf der Kontaktseite lädt zusätzlich die eingebettete Karte, und sie darf Google-Cookies setzen.

Nach kanadischem Recht genügt es, das in der Datenschutzerklärung offenzulegen. Verkauft Matthew aber an Kunden in der EU, gilt eine strengere Lesart: Eingebettete Dienste, die Cookies setzen, brauchen dann eine Einwilligung (EuGH, *Fashion ID*, 2019), und das Laden von Google Fonts ohne Einwilligung hat ein deutsches Gericht für unzulässig erklärt (LG München I, 2022).

Dazu kommt: Die Datenschutzerklärung muss jeden dieser Dienste einzeln erklären, und die zusätzlichen Verbindungen zu Google verlangsamen den ersten Seitenaufbau.

## Lösung (Solution)

Die Schriften liegen auf dem eigenen Server und sehen genauso aus wie heute; keine Seite spricht beim Aufruf mehr Google Fonts an. Auf der Kontaktseite steht anstelle der Karte ein ruhiger Platzhalter mit der Studio-Adresse und einem Knopf „Karte anzeigen"; erst dieser Klick lädt Google Maps.

Das Kontaktformular behält Googles reCAPTCHA als Spamschutz. Die Kontaktseite spricht damit beim Aufruf weiterhin einen Google-Dienst an; alle anderen Seiten nicht mehr.

Die Datenschutzerklärung schrumpft entsprechend: ein Satz zur Karte, die nur auf Wunsch lädt, und ein Satz zu reCAPTCHA im Kontaktformular.

## User Stories

1. Als Besucher möchte ich, dass beim Öffnen der Website keine Daten an Google Fonts gehen, um nicht ungefragt verfolgt zu werden.
2. Als Besucher möchte ich die Schriften genauso sehen wie bisher, um keinen Unterschied im Erscheinungsbild zu bemerken.
3. Als Besucher mit langsamer Verbindung möchte ich, dass die Seite schneller steht, weil keine Verbindung zu weiteren Servern aufgebaut werden muss.
4. Als Besucher möchte ich, dass Text sofort lesbar ist, auch bevor die Schrift geladen ist, um nicht auf leere Flächen zu schauen.
5. Als Besucher der Kontaktseite möchte ich die Studio-Adresse sofort lesen können, ohne dass eine Karte laden muss.
6. Als Besucher der Kontaktseite möchte ich die Karte mit einem Klick einblenden können, um den Weg zum Studio zu sehen.
7. Als Besucher möchte ich vor dem Klick erfahren, dass die Karte von Google Maps kommt, um bewusst entscheiden zu können.
8. Als Besucher möchte ich die Adresse alternativ direkt in Google Maps öffnen können, um die Route in meiner Karten-App zu planen.
9. Als Besucher ohne JavaScript möchte ich die Adresse und den Link zu Google Maps weiterhin nutzen können.
10. Als Besucher auf dem Telefon möchte ich, dass Platzhalter und Karte die Breite des Bildschirms nutzen und nichts seitlich überläuft.
11. Als Matthew möchte ich, dass das Kontaktformular unverändert funktioniert und weiterhin durch reCAPTCHA vor Spam geschützt ist, um keine Anfrage zu verlieren und nicht aussortieren zu müssen.
12. Als Matthew möchte ich die Beschriftung des Karten-Knopfs und den Hinweis auf Google im CMS ändern können, um den Ton selbst zu bestimmen.
13. Als Matthew möchte ich, dass die Karte nach einem Umzug weiterhin aus der Studio-Adresse in den Einstellungen entsteht, um nur eine Stelle pflegen zu müssen.
14. Als Matthew möchte ich eine kürzere, verständliche Datenschutzerklärung, um sie selbst verantworten zu können.
15. Als Dan möchte ich die Lizenzen der Schriften mit ausliefern, um die Bedingungen der SIL Open Font License einzuhalten.
16. Als Dan möchte ich prüfen können, dass keine Seite beim Aufruf Google Fonts oder die Google-Karte anspricht, um Rückfälle zu bemerken.
17. Als Dan möchte ich, dass die cookiefreie Messung mit Umami davon unberührt bleibt.

## Implementierungs-Entscheidungen (Implementation Decisions)

- **Schriften selbst hosten.** Fraunces als variable Schrift mit der Achse für optische Größe und den Gewichten 500 und 900, Karla mit 400, 500 und 700, jeweils als WOFF2 im lateinischen Teilsatz, mit der Lizenzdatei daneben. Die Schriften liegen bei den übrigen statischen Dateien der Website. Das Stylesheet bekommt eigene `@font-face`-Regeln mit `font-display: swap`; die Theme-Variablen für die beiden Schriftfamilien bleiben, wie sie sind. Die beiden wichtigsten Dateien werden im Basis-Layout vorgeladen, die Verweise auf Google Fonts entfallen.
- **Karte erst auf Klick.** Der Kartenbereich der Kontaktseite zeigt zunächst die Studio-Adresse, einen Hinweis, dass die Karte von Google Maps kommt, einen Knopf „Karte anzeigen" und einen gewöhnlichen Link „In Google Maps öffnen". Erst der Klick setzt die eingebettete Karte ein, mit derselben Adresse wie heute. Ohne API-Schlüssel bleibt der Bereich wie bisher leer. Das Skript folgt den übrigen Skripten der Website: in eine Funktion gekapselt, ohne Cookies und ohne `localStorage` — die Entscheidung gilt nur für den aktuellen Seitenaufruf.
- **Beschriftungen aus dem CMS.** Knopftext, Hinweis und Linktext kommen aus den Einstellungen (Settings, Gruppe der geteilten Beschriftungen), nicht fest aus dem Template.
- **reCAPTCHA bleibt unverändert** (Entscheidung Dan, 2026-09-19). Das Kontaktformular, sein Honeypot-Feld und das von Netlify eingesetzte reCAPTCHA werden nicht angefasst.
- **Datenschutzerklärung.** Der Absatz über Google-Dienste schrumpft auf zwei Sätze: Die Karte auf der Kontaktseite lädt Google Maps nur, wenn man auf „Karte anzeigen" klickt; das Kontaktformular ist durch Google reCAPTCHA geschützt, das beim Aufruf der Kontaktseite lädt und Google-Cookies setzen darf. Für beide gilt Googles Datenschutzerklärung.
- **Die Messung bleibt unberührt.** Umami lädt weiterhin nur mit gesetzter Website-ID und setzt keine Cookies.

## Test-Entscheidungen (Testing Decisions)

- **Gute Tests prüfen, was der Besucher erlebt,** nicht wie es gebaut ist: welche Server eine Seite beim Aufruf anspricht, ob die Karte nach dem Klick erscheint, ob das Formular ankommt.
- **Höchste Nahtstelle: die gebaute Website.** Eine Prüfung über alle erzeugten HTML-Seiten, dass keine auf `fonts.googleapis.com`, `fonts.gstatic.com` oder `google.com/maps/embed` verweist. reCAPTCHA ist ausdrücklich ausgenommen. Vorbild ist der vorhandene HTML-Vergleich zweier Builds; ein Vergleich vor und nach dem Umbau zeigt zusätzlich, dass sich außer Kopfbereich und Kartenbereich nichts geändert hat.
- **Im Browser, auf der Deploy-Vorschau:** Beim Aufruf der Startseite zeigt das Netzwerkprotokoll keine Anfrage an einen Google-Server. Auf der Kontaktseite erscheinen nur die Anfragen von reCAPTCHA, keine von Google Fonts oder Google Maps. Nach dem Klick auf „Karte anzeigen" lädt die Karte. Ohne JavaScript bleiben Adresse und Link nutzbar.
- **Erscheinungsbild:** Überschriften und Fließtext der Startseite vorher und nachher bei Desktop- und Telefonbreite vergleichen; Schriftart, Stärke und optische Größe müssen übereinstimmen.
- **Formular:** Eine Testnachricht auf der Deploy-Vorschau kommt in Netlify an, reCAPTCHA erscheint wie bisher.
- **CMS:** Die neuen Beschriftungen überstehen einen Round-Trip durch Tina, wie bei den übrigen Einstellungen.

## Nicht im Leistungsumfang (Out of Scope)

- Ausbau oder Umbau von reCAPTCHA (Entscheidung 2026-09-19).
- Ein Cookie-Banner oder eine Einwilligungsverwaltung.
- Der Shopify-Shop mit seinen eigenen Cookies und seiner eigenen Datenschutzerklärung.
- Die cookiefreie Messung mit Umami.
- Andere Schriften oder eine Änderung des Designs.
- Eine Karte von einem anderen Anbieter; das kann eine spätere Entscheidung sein, wenn Google Maps ganz entfallen soll.

## Weitere Anmerkungen (Further Notes)

- Die rechtliche Einordnung ist eine Recherche, keine Rechtsberatung. Ob EU-Recht überhaupt greift, hängt davon ab, ob Matthew gezielt an Kunden in der EU verkauft (Versand, Preise in Euro); die bloße Erreichbarkeit der Website genügt nicht.
- Mit reCAPTCHA setzt die Kontaktseite weiterhin Google-Cookies beim Aufruf. Unter der strengen EU-Lesart bliebe das die eine Stelle, die eine Einwilligung bräuchte. Falls das je relevant wird, wäre der kleinste Schritt, reCAPTCHA erst beim ersten Tippen ins Formular zu laden, statt es auszubauen.
- Die heutige Datenschutzerklärung nennt die drei Google-Dienste, damit sie bis zu diesem Umbau stimmt. Nach dem Umbau muss sie angepasst werden, sonst beschreibt sie Dienste, die nicht mehr beim Aufruf laden.
- Nebeneffekt: Ohne die Verbindungen zu Google Fonts steht die Seite schneller, besonders auf dem Telefon.

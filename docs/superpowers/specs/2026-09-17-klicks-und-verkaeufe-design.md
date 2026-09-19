# Klicks und Verkäufe messen — Design

Recherche 2026-09-17, Entscheidungen im Grilling am 2026-09-18 geschärft. Umsetzung erst **nach** der Tina-Umstellung (Spec `2026-09-14-tinacloud-migration-design.md`, Phase 3), Plan `docs/superpowers/plans/2026-09-17-klicks-und-verkaeufe.md`.

## 1. Ziel

Drei Entscheidungen soll die Messung tragen, in dieser Reihenfolge:

1. **Rotation beschneiden.** Sechs Shop-Sets wechseln sich zufällig ab. Welche verdienen ihren Platz? Dafür zählt die Klickrate je Set, nicht der Umsatz.
2. **Belegen, dass die Seite verkauft.** Eine Zahl im Monat: Umsatz, den Shopify der Domain `matthewfreed.ca` zuordnet.
3. **Sehen, wo Besucher abspringen.** Welche Seiten werden gelesen, und erreichen die Leute den Shop-Teil überhaupt?

**Nicht Ziel:** steuern, was Matthew töpfert. Dafür bräuchte es Verkaufszahlen je Stück über Monate; die Datenmenge gibt das nicht her (Abschnitt 7).

## 2. Ausgangslage (geprüft am 2026-09-17)

- **Keine Messung vorhanden.** Kein Google Analytics, kein Zählpixel. Das einzige Fremdskript ist das Netlify-Identity-Widget, ein Decap-Überbleibsel, das die Aufräumphase entfernt.
- **31 Shop-Links** in sechs Templates (`nav`, `hero`, `collections-teaser`, `current-firing`, `collections-layout`, `about-layout`). Die Ziel-URLs stehen teils in `global.json` (`shop.base`), teils als volle URL im von Tina gepflegten Inhalt (`home.md`, Galerie-Slugs).
- **Kein Link trägt Parameter.** Shopify ordnet den Verkehr deshalb pauschal der Domain zu.
- **`/shop` und `/Shop`** in `src/_redirects` zeigen auf `http://shop.matthewfreed.ca` — unverschlüsselt und auf eine andere Domain als die sonst genutzte `.net`. Gemessen: zwei Weiterleitungen, die Parameter überleben sie (`curl -L`, 2026-09-17).
- **Die Datenschutzerklärung behauptet**, die Seite sammle Cookies und Logdateien. Das ist Shopify-Textbaustein und stimmt nicht.

## 3. Entscheidungen

| Thema | Entscheidung |
|---|---|
| Vorgehen | Zwei Schichten. Schicht 1 (UTM-Parameter, kostenlos) trägt allein schon die Zuordnung in Shopify. Schicht 2 (Analytics auf der eigenen Seite) zeigt zusätzlich die Klicks, die den Shop nie erreichen |
| UTM-Schema | `utm_source=matthewfreed.ca`, `utm_medium=referral`, `utm_campaign=website`, `utm_content=<Platzierung>`. **`utm_campaign` ist Pflicht**: ohne sie zählt Shopify den Besuch nicht als Marketing |
| Platzierung (`utm_content`) | **Ort, nicht Stück:** `nav`, `hero`, `about-medal`, `redirect-shop`, `home-teaser-<slug>`, `collections-<slug>`, `firing-shop-all`, `firing-<set>-featured`, `firing-<set>-tile1` bis `tile4`. Welches Stück gemeint war, weiß Shopify aus der Landeseite. Stückname wäre lesbarer, bricht aber die Historie, sobald Matthew ihn in Tina ändert (entschieden 2026-09-18) |
| Wo die Parameter entstehen | In einem Eleventy-Filter zur Bauzeit, **nicht im CMS**. Matthew tippt nie Parameter; die URLs in Tina bleiben sauber |
| Einblendungen | Jeder Seitenaufruf meldet, **welches Set gezeigt wurde** (`firing-shown`), und ob der Shop-Teil überhaupt ins Bild kam (`firing-seen`). Ohne das ist ein Set mit wenigen Klicks nicht von einem selten gezeigten zu unterscheiden |
| Weitere Ereignisse | `directions` (Karten-Link auf der Events-Seite), `glaze-slider` (erste Nutzung), `contact-sent` (Formular abgeschickt). Damit wird Ziel 3 beantwortbar |
| Analytics-Dienst | **Umami Cloud, kostenloser Tarif.** Cookiefrei, damit kein Banner nötig ist. Kostenpflichtige Dienste (Plausible 9 $, Fathom 15 $) wurden verworfen, weil kostenlos gefordert war |
| Aktivierung | Über `UMAMI_WEBSITE_ID` in der Umgebung. Ohne Variable rendert kein Skript — die Seite bleibt bis zur Anmeldung unverändert |
| Zugang | Konto auf Dan. Matthew bekommt die **Share-URL**, ein Lesezugriff ohne Anmeldung ([Umami-Doku](https://docs.umami.is/docs/enable-share-url)). Der kostenlose Tarif reicht damit für beide |
| Eigene Besuche | **Werden mitgezählt.** Umami könnte sie per `localStorage`-Schalter ausnehmen; der Aufwand lohnt bei zwei Personen nicht. Beim Lesen der Zahlen mitdenken (Abschnitt 7) |
| Rotation während der Messung | Alle sechs Sets bleiben drin. Nach einem Monat wird entschieden: unter etwa 100 Shop-Klicks im Monat auf drei Sets kürzen, damit je Set genug zusammenkommt |
| Auswertung | Von Hand, nach der Liste in Task 8 des Plans. Kein Automatismus, kein API-Schlüssel |
| Datenschutzerklärung | Wird im selben Schritt an die Wirklichkeit angepasst. Matthew liest den Text gegen, bevor er live geht |
| Einwilligung | Kein Banner. Umami setzt laut Anbieter keine Cookies und anonymisiert die Daten; die Seite selbst setzt danach weiterhin keine Cookies |

## 4. Verworfen

- **Google Analytics 4 mit domainübergreifender Messung.** `matthewfreed.ca` und `shop.matthewfreed.net` sind verschiedene Domains, teilen also keine Cookies. Google erklärt eigene Tags im Shopify-Custom-Pixel ausdrücklich für nicht unterstützt ([Google-Hilfe, 2026-09-17](https://support.google.com/analytics/answer/16000892)). Dazu kämen Cookie-Banner und rund 150 KB Skript.
- **Heatmaps (Microsoft Clarity).** Würde Ziel 3 am direktesten beantworten, setzt aber Cookies und bräuchte damit ein Banner. Fällt aus, solange „kein Banner" gilt.
- **Cloudflare Web Analytics und Netlify Analytics.** Beide können ausgehende Klicks nicht messen; bei Netlify liegt das in der Bauart, weil solche Klicks dessen Server nie erreichen.
- **Bezahlte Attributions-Werkzeuge** (Triple Whale, Lifetimely). Für diese Größenordnung sinnlos.
- **Eigene Zählung über Netlify-Logs.** Log Drains gibt es nur im Enterprise-Tarif.
- **Deterministische Rotation** (ein Set je Tag oder Woche) statt Einblendungszählung. Hätte den Vergleich ohne Zusatzereignis ermöglicht, ändert aber das Verhalten der Seite für ein Messproblem.

## 5. Was Shopify von sich aus liefert

Ohne eine Zeile Code, sobald die Links Parameter tragen (alle Angaben aus der Shopify-Hilfe, geprüft am 2026-09-17):

- **Sales → Total sales by referrer:** Umsatz je verweisender Domain. Die Zeile `matthewfreed.ca` beantwortet Ziel 2.
- **Marketing → Performance by UTM campaign** und **Sales attributed to marketing:** Sitzungen und Umsatz je Kampagne und Platzierung.
- **Behaviour → Sessions by landing page:** welche Shop-Seite als Einstieg dient.
- **Produktseite → Product insights:** verkaufte Stück je Verkehrsquelle, 90 Tage rollierend.
- **Bestellung → Conversion details:** der Weg eines einzelnen Käufers über 30 Tage. Bei Matthews Bestellmenge aussagekräftiger als jedes Dashboard.

Offen: Shopify nennt inzwischen für alle Tarife „200+ reports"; ältere Artikel behaupten, Marketing-Berichte bräuchten Grow. **Im Adminbereich prüfen**, bevor ein Arbeitsablauf darauf aufbaut. Sitzungsdaten reichen nur bis 2022-10-01 zurück, Marketing-Berichte laufen bis zu 24 Stunden nach, Conversion details bis zu 48 Stunden. Der Filter „Human or bot session" (seit 2025-10-27) gehört eingeschaltet.

**Zugriff ungeklärt (Stand 2026-09-19):** Dan hat keinen Shopify-Zugang. Matthew wird per E-Mail (Entwurf, noch nicht verschickt) gebeten, das Projekt freizugeben, und entweder einen vierstelligen Kollaborator-Code zu teilen (Settings > Users > Security), damit Dan Kollaborator-Zugriff mit ausschließlich der Berechtigung „Analytics > Reports" beantragen kann, oder die monatliche Prüfung selbst zu übernehmen. Shopifys Basic-Tarif erlaubt null Staff-Accounts; Kollaborator-Konten zählen nicht gegen dieses Limit, ob sie auf Basic überhaupt funktionieren, ist nicht bestätigt. Ob die oben genannten Berichte auf Matthews Tarif verfügbar sind, bleibt damit weiterhin ungeprüft.

## 6. Umami, die geprüften Eckdaten

- Skript: `<script defer src="https://cloud.umami.is/script.js" data-website-id="…"></script>`. Optional `data-domains`, damit Vorschau-Deploys und `localhost` nicht mitzählen ([Umami-Doku](https://docs.umami.is/docs/tracker-configuration)).
- Ereignisse: `umami.track(name, data)`; Ereignisnamen höchstens 50 Zeichen ([Umami-Doku](https://docs.umami.is/docs/track-events)).
- Cookies: „Umami does not use any cookies in the tracking code", Daten anonymisiert, kein Cookie-Hinweis nötig ([Umami-FAQ](https://docs.umami.is/docs/faq)).
- Share-URL: Lesezugriff ohne Anmeldung, je Website in den Einstellungen einschaltbar ([Umami-Doku](https://docs.umami.is/docs/enable-share-url)).
- Eigene Besuche ließen sich mit `localStorage.setItem('umami.disabled', 1)` je Browser ausnehmen ([Umami-Doku](https://docs.umami.is/docs/exclude-my-own-visits)) — bewusst nicht genutzt.
- Kostenloser Tarif laut Recherche: 100 000 Ereignisse im Monat, eine Website, sechs Monate Aufbewahrung. Bei der Anmeldung am 2026-09-19 nicht gegengeprüft, Preisseite war maschinell nicht lesbar. **Beim nächsten Login prüfen.**
- Ereignisbudget je Seitenaufruf der Startseite: 1 Aufruf + `firing-shown` + gegebenenfalls `firing-seen` und ein Klick. Bei dieser Größenordnung weit unter dem Kontingent.
- Konto eingerichtet (Dan, 2026-09-19); die Website-ID steht öffentlich im HTML jeder Seite, `UMAMI_WEBSITE_ID` liegt als Umgebungsvariable auf Netlify.
- Share-URL für Matthew: Umami → Settings → Websites → Edit → Share URL. Empfohlene Ansichten: Overview, Events, Compare.

## 7. Risiken

- **Kleine Zahlen.** Bei niedriger zweistelliger Bestellmenge im Monat ist keine Aussage je Stück statistisch belastbar. Deshalb ist „steuern, was Matthew töpfert" kein Ziel. Die Messung zeigt Richtungen, keine Beweise.
- **Sechs Sets teilen den Verkehr.** Jedes Set sieht nur etwa ein Sechstel der Besucher. Die Entscheidung nach einem Monat (Abschnitt 3) ist genau dafür da.
- **Eigene Besuche sind enthalten.** Wer die Seite während der Arbeit oft öffnet, hebt die Zahlen. Bei auffälligen Ausschlägen zuerst daran denken.
- **Ein großer „Direct"-Anteil ist normal.** Tippeingaben und Privatmodus verlieren den Verweis; das heißt nicht, dass die Seite nichts bringt.
- **Sechs Monate Aufbewahrung** im kostenlosen Tarif: ein Vergleich mit dem Vorjahr ist nicht möglich. Wenn das je gebraucht wird, monatlich exportieren.
- **Weiterleitungen fressen Parameter.** Ausgelaufene Produkt-Handles, die Shopify auf eine Collection umleitet, verlieren die Zuordnung. Deshalb zeigt `/shop` künftig direkt auf die `.net`-Adresse.
- **Shopify hat zum 2026-01-01 die Cookies `_shopify_y` und `_shopify_s` abgeschafft.** Jede ältere Anleitung, die sie ausliest, ist tot.
- **Wechsel des Dienstes bleibt möglich.** Die Ereignisse hängen an einer einzigen Stelle (`window.umami.track`); ein Umzug zu Plausible oder Fathom wäre ein Austausch des Skripts und dieser Aufrufe.
- **Rechtliches.** Quebecs Law 25 ist strenger als PIPEDA. Cookiefreie Messung umgeht die Frage, ersetzt aber keine Rechtsberatung.

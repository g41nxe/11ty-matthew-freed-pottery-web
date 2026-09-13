# 1. TinaCloud statt selbst gehostetem Tina

Wir betreiben TinaCMS über den kostenlosen TinaCloud-Tarif, nicht selbst gehostet. Die laufende Migration auf `feat/tinacms-migration` wird fortgesetzt; nur die Backend-Schicht wird ausgetauscht.

Ersetzt die Zeilen „Hosting", „Database", „Auth" und „Git provider" der Tabelle *Locked decisions* in `docs/superpowers/specs/2026-07-19-tinacms-migration-design.md`.

## Kontext

Matthew bearbeitet die Seite ausschließlich im CMS. Decap macht verschachtelte Inhalte mühsam, und sein Git-Gateway-Backend ist abgekündigt. Im Juli fiel die Wahl auf selbst gehostetes Tina.

Diese Migration ist am 2026-07-19 an der Infrastruktur steckengeblieben, nicht am Editor: ein Speicherüberlauf in `tina:build` auf Netlify, ein Modul-Konflikt von Auth.js unter Netlifys Bundler, und eine Weiterleitung, die jede Anfrage an das Tina-Backend mit 404 beantwortete. Der Tor-Spike (Plan, Task 1.9) wurde nie auf der Deploy-Vorschau abgeschlossen.

Anforderungen, festgelegt am 2026-09-13: **kostenlos**, und **kompatibel mit dem vorhandenen Stack** aus Eleventy, Netlify und GitHub, Inhalte bleiben im Repo.

Geprüft wurden die Git-basierten Systeme der [Eleventy-CMS-Liste](https://www.11ty.dev/docs/cms/) sowie beide Tina-Varianten:

- **Pages CMS** ist am stack-verträglichsten: keine Änderung am Build, keine Abhängigkeiten, nur eine `.pages.yml`. Es verwirft beim Speichern aber jedes nicht konfigurierte Feld, weil es den Inhalt gegen ein Zod-Schema aus den deklarierten Feldern prüft und nur das Ergebnis schreibt. Die Option `settings.content.merge` rettet Felder auf oberster Ebene und in Objekten, ersetzt Listen jedoch vollständig. Jedes Feld in Galerie, Produkten, Events, News und FAQ müsste lückenlos deklariert sein.
- **CloudCannon** kostet 55 Dollar im Monat.
- **Mattrbld** braucht Selbsthosting samt Proxy und hängt an einem Entwickler.
- **Spinal** kann keine strukturierten JSON-Daten.
- **GitCMS** war nicht erreichbar.

## Entscheidung

TinaCloud im kostenlosen Tarif mit zwei Nutzern: Dan und Matthew.

Die bisherige Arbeit auf dem Migrations-Branch bleibt die Grundlage: Datenbereinigung (Welle 0), Schema-Gerüst und der Plan für Welle 2. Entfernt wird das Selbsthosting: MongoDB, Auth.js, die Netlify-Funktion und alles, was nur ihnen dient.

## Konsequenzen

- **Entfällt:** `tina/database.ts`, `netlify/functions/tina.ts`, die Auth.js-Abhängigkeiten, die Nutzer-Seeds, die Weiterleitung `/api/tina/*`, sowie die Geheimnisse `MONGODB_URI`, `NEXTAUTH_SECRET` und das GitHub-Token.
- **Kommt hinzu:** ein TinaCloud-Projekt mit verbundener GitHub-App, `tinacms build` vor dem Eleventy-Build, und zwei Umgebungsvariablen auf Netlify, die öffentliche Client-ID und `TINA_TOKEN` ([Netlify-Anleitung](https://tina.io/docs/tinacloud/deployment-options/netlify)).
- **Harte Grenze von zwei Nutzern.** Ein dritter Bearbeiter erfordert den Team-Tarif für 24 Dollar im Monat ([Preise](https://tina.io/pricing)).
- **Das Bearbeiten hängt an TinaCloud, die Seite nicht.** Eleventy liest die Inhalte direkt von der Platte; fällt der Dienst aus, bleibt die veröffentlichte Seite unberührt.
- **Undeklarierte Felder bleiben beim Speichern erhalten.** Auf dem Migrations-Branch lokal nachgewiesen (Plan, Task 1.9, Schritt 5).
- **Offen:** ob der Speicherüberlauf im Build mit TinaCloud wiederkehrt. Der selbst gehostete Build indexierte zusätzlich in die Datenbank; dieser Teil entfällt.
- **Weiter ungeprüft:** ob Tinas Editor verschachtelte Inhalte spürbar besser bedienbar macht als Decap. Der Migrations-Spec führt das selbst als Annahme, die vor der Massenarbeit zu prüfen ist (Abschnitt 7, Punkt 5).

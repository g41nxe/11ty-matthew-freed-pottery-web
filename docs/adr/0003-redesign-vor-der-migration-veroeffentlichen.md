# 3. Redesign vor der Migration veröffentlichen

Das neue Design geht auf Decap live, bevor die Migration auf TinaCloud abgeschlossen ist. Beides sind getrennte Veröffentlichungen.

## Kontext

Stand 2026-09-13:

- **Produktiv ist `main`** mit dem alten Design und Decap über Git Gateway. Matthew hat dort zuletzt am 2026-07-15 Events gepflegt.
- **`feat/site-redesign-v2` ist 87 Commits voraus** und hat keinen Rückstand gegenüber `main`. Matthew hat das Design im Juli abgenommen; sein Feedback ist umgesetzt.
- **`feat/tinacms-migration` hat 33 eigene Commits.** Der Tor-Spike ist offen, und ob Tinas Editor verschachtelte Inhalte besser bedienbar macht, ist ungeprüft (ADR 0001).
- **Auf v2 steckt ein Fehler in der Decap-Konfiguration.** Die Absätze auf About, Pottery und Process sind im Inhalt eine Liste von Zeichenketten, das CMS erwartet eine Liste von Objekten. Matthew sieht leere Felder; bearbeitet er eins, erscheint `[object Object]` auf der Seite.
- **Welle 0 des Migrationsplans behebt diesen Fehler** und ist ausdrücklich so gebaut, dass die Seite dabei weiter auf Decap läuft.

## Entscheidung

1. Die Datenbereinigung aus Welle 0 wird von `feat/tinacms-migration` nach `feat/site-redesign-v2` übernommen, einschließlich der zugehörigen Decap-Konfiguration.
2. Die beiden SEO-Fehler aus ADR 0002 werden auf v2 behoben: die Namenskollision auf der Händlerseite und das relative Vorschaubild.
3. v2 wird nach `main` gemergt und geht live.
4. Die Migration setzt danach auf `main` auf.

## Konsequenzen

- **Decap bleibt für die Dauer der Migration das produktive CMS**, samt dem abgekündigten Git Gateway. Die feldweisen Bildordner aus dem Bildumbau vom 2026-09-12 werden damit tatsächlich genutzt.
- **Das fertige Design wird nicht an eine offene Migration gekettet.** Scheitert oder verzögert sich Tina, ist das Redesign trotzdem veröffentlicht.
- **Zwei überschaubare Umstellungen statt einer großen.** Die Inhaltssperre, die der Migrations-Spec für die Tina-Umstellung vorsieht, betrifft nur diese zweite Umstellung.
- **Die Migration startet auf einem neuen Branch von `main`.** Ursprünglich sollte `feat/tinacms-migration` `main` aufnehmen. Nach dem Release von v2.0.3 lag er 50 Commits zurück, und rund die Hälfte seiner 33 eigenen Commits war Selbsthosting, das ADR 0001 wieder entfernt. Am 2026-09-14 fiel deshalb die Entscheidung für `feat/tinacloud-migration` von `main`, mit den wiederverwendbaren Commits per Cherry-Pick. Der alte Branch bleibt als Archiv auf GitHub.
- **Bis Tina live ist, pflegt Matthew in Decap mit dessen schwacher Bedienung verschachtelter Inhalte.** Das ist der Zustand von heute, nicht schlechter.

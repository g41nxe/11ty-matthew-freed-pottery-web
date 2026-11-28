import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Zwei Regeln für die Schrift, auf jeder Seite dieselben. Beide gab es nicht,
// und so standen Etiketten in 10, 11 und 12 Pixeln nebeneinander und blasse
// Zeilen mit 2,8:1 Kontrast auf hellem Grund (Review vom 28.11.2026).
function vorlagen(ordner) {
    return fs.readdirSync(ordner, { withFileTypes: true }).flatMap((eintrag) => {
        const pfad = path.join(ordner, eintrag.name);
        if (eintrag.isDirectory()) return vorlagen(pfad);
        return /\.(njk|md)$/.test(eintrag.name) ? [pfad] : [];
    });
}
const dateien = vorlagen(path.join("src", "views"));

// Schriftgrößen kommen aus der Skala (text-xs, text-sm ...). Ein Etikett ist
// ein cap-label und damit 12 Pixel; kleiner wird es nirgends.
test("keine Schriftgröße neben der Skala", () => {
    for (const datei of dateien) {
        const fund = fs.readFileSync(datei, "utf8").match(/text-\[\d+(\.\d+)?(px|rem|em)\]/g);
        assert.equal(fund, null, `${datei}: ${fund} -- eine Größe aus der Skala nehmen, für Etiketten cap-label ohne Zusatz`);
    }
});

// Die blasse Textfarbe (soft, 2,8:1 auf Papier) trägt keinen Text auf hellem
// Grund; dafür gibt es muted (4,6:1). Sie bleibt im Fuß der Seite, wo der
// Grund dunkel ist, und für Platzhalter in Formularfeldern, die verschwinden,
// sobald jemand tippt.
test("die blasse Textfarbe steht nur im Fuß und in Platzhaltern", () => {
    for (const datei of dateien) {
        if (path.basename(datei) === "footer.njk") continue;
        const ohnePlatzhalter = fs.readFileSync(datei, "utf8").split("placeholder:text-soft").join("");
        assert.ok(!ohnePlatzhalter.includes("text-soft"), `${datei}: text-soft auf hellem Grund -- text-muted nehmen`);
    }
});

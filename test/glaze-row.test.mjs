import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nunjucks = require("nunjucks");
const seitentexte = require("../src/views/_data/gallery.json").page;

// Die Reihe unter "... out of the kiln" wird hier wirklich gerendert, für jede
// Stückzahl mit und ohne Termin, und dann werden die Karten gezählt. Die Tests
// in glaze-pages.test.mjs lesen nur den Quelltext der Vorlage; die fanden
// nicht, dass ohne Termin eine Karte fehlt und die Reihe mit einem Loch endet.
//
// Gerendert wird nur der Block der Reihe, mit Attrappen für das, was sonst
// Eleventy stellt: die Filter des Terminbands, der Shop-Link und das
// Bild-Kürzel, das hier ein schlichtes <img> wird.
const vorlage = fs.readFileSync(path.join("src", "views", "glaze.njk"), "utf8").replace(/\r\n/g, "\n");
const anfang = vorlage.indexOf("{% set upcoming = ");
const ende = vorlage.indexOf("{# Same line the home page carries");
const block = vorlage.slice(anfang, ende).replace(/{%\s*img [^%]*%}/g, "<img>");

const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join("src", "views", "_includes", "partials")), { autoescape: true });
for (const name of ["occurrences", "filterUpcoming", "byDateAsc", "nextUp", "shopLink", "withoutGlaze"]) env.addFilter(name, (wert) => wert);
env.addFilter("date", () => "2026-12-05");

function reihe(stuecke, termine) {
    const html = env.renderString(block, {
        glaze: {
            name: "Jericho",
            swatch: "#9A93B4",
            pieces: Array.from({ length: stuecke }, (_, i) => ({ url: "https://shop.example/p" + i, title: "Piece " + i, image: "x.jpg", alt: "", price: "$10", available: true })),
        },
        events: Array.from({ length: termine }, (_, i) => ({ name: "Market " + i, date: "2026-12-0" + (i + 5), location: "Vancouver", time: "10 a.m." })),
        gallery: { page: seitentexte, items: [] },
        global: { labels: { next_up: "Next up", dates_soon: "New dates soon", sold_out: "Sold out", slider_prev: "Previous", slider_next: "Next" } },
    });
    assert.ok(anfang > -1 && ende > anfang && html.includes('id="glaze-markets"'), "der Block der Reihe ist in glaze.njk nicht mehr zu finden");
    const stelle = (teil) => html.indexOf(teil);
    return {
        html,
        slider: /id="glaze-markets" data-slider/.test(html),
        stuecke: html.split('target="_blank"').length - 1,
        platzhalter: html.split('style="color: #9A93B4"').length - 1,
        texte: html.split(seitentexte.empty_note).length - 1,
        marktkacheln: html.split("data-market-tile").length - 1,
        termine: (html.match(/<a href="\/events\.html"\s+data-event[^>]*>/g) || []).filter((tag) => !/\shidden\s/.test(tag)).length,
        folge: [stelle('target="_blank"'), stelle('style="color: #9A93B4"'), stelle("data-market-tile"), stelle("data-event")].filter((i) => i > -1),
    };
}

test("die Reihe hält für jede Stückzahl die richtigen Karten in der richtigen Folge", () => {
    for (let stuecke = 0; stuecke <= 5; stuecke++) {
        const r = reihe(stuecke, 3);
        const fall = `${stuecke} Stücke, mit Termin`;
        assert.equal(r.stuecke, stuecke, `${fall}: nicht jedes Stück steht in der Reihe`);
        assert.equal(r.platzhalter, Math.max(0, 2 - stuecke), `${fall}: falsche Zahl von Platzhaltern`);
        assert.equal(r.marktkacheln, 1, `${fall}: die Marktkachel fehlt oder steht doppelt`);
        assert.equal(r.termine, 1, `${fall}: sichtbar ist nicht genau ein Termin`);
        const karten = r.stuecke + r.platzhalter + r.marktkacheln + r.termine;
        assert.ok(karten >= 4, `${fall}: nur ${karten} Karten, die Reihe hat ein Loch`);
        // Genau vier Karten stehen fest, mehr gleiten.
        assert.equal(r.slider, karten > 4, `${fall}: ${karten} Karten, Slider ${r.slider}`);
        // Wer gleitet, bekommt die Linie und die Pfeile darunter; vier feste Karten brauchen keine.
        assert.equal(r.html.includes('data-slider-nav="glaze-markets"'), r.slider, `${fall}: die Leiste unter der Reihe passt nicht zum Slider`);
        if (r.slider) assert.match(r.html, /<button type="button" data-slider-prev disabled aria-label="Previous"[\s\S]*<button type="button" data-slider-next aria-label="Next"/, `${fall}: die Pfeile fehlen oder haben keinen Namen`);
        assert.deepEqual([...r.folge].sort((a, b) => a - b), r.folge, `${fall}: die Folge ist nicht Stücke, Platzhalter, Marktkachel, Termin`);
        // Zwei Platzhalter tragen den Satz nur einmal.
        if (seitentexte.empty_note) assert.equal(r.texte, Math.min(r.platzhalter, 1), `${fall}: der Satz der Platzhalter steht nicht genau einmal`);
    }
});

// Ohne Termin fehlt die letzte Karte. Die Marktkachel nimmt ihren Platz mit
// ein; das regelt main.css, weil es auch gelten muss, wenn der letzte Termin
// erst nach dem Bau vorbeigeht und events.js ihn im Browser versteckt.
test("ohne Termin füllt die Marktkachel den freien Platz", () => {
    for (let stuecke = 0; stuecke <= 3; stuecke++) {
        const r = reihe(stuecke, 0);
        assert.equal(r.termine, 0);
        assert.equal(r.marktkacheln, 1, `${stuecke} Stücke, ohne Termin: die Marktkachel fehlt`);
        assert.equal(r.stuecke + r.platzhalter + r.marktkacheln, Math.max(3, stuecke + 1));
    }
    const css = fs.readFileSync(path.join("src", "styles", "main.css"), "utf8").replace(/\r\n/g, "\n");
    assert.match(css, /#glaze-markets:not\(\[data-slider\]\):not\(:has\(\[data-event\]:not\(\[hidden\]\)\)\) > \[data-market-tile\] \{\s*grid-column: span 2;/, "in der festen Viererreihe bleibt ohne Termin ein Platz leer");
    assert.match(css, /#glaze-markets\[data-slider\]:not\(:has\(\[data-event\]:not\(\[hidden\]\)\)\) > \[data-market-tile\]:nth-child\(4\) \{\s*flex-grow: 1;/, "mit drei Stücken und ohne Termin endet die Reihe vor dem Seitenrand");
});

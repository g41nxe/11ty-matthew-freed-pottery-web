// The shop sets: named groups of pieces that the home page rotates through
// and that the glaze page of the same name shows as its shop grid. They used
// to sit in the front matter of home.md, which made them look like home page
// content and sent anyone looking for the pieces of a glaze to the wrong
// place. They belong to neither page.
//
// This module is the one place that reads them. Everything else — the glaze
// pages, the sold-out check, the link check in scripts/ — goes through here,
// so a change of storage stays a change of one file.
const { sets } = require("./shop_sets.json");

module.exports = {
    all: sets,
    // Matched by name, the same string the CMS shows: "Jericho", "Tree of Life".
    byName: Object.fromEntries(sets.map((set) => [set.name, set])),
    // Only the sets in the home page rotation; a hidden set is withdrawn and
    // shows neither there nor on its glaze page.
    visible: sets.filter((set) => !set.hide),
};

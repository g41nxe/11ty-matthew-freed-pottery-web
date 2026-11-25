// Hebt .cache zwischen zwei Netlify-Deploys auf. Dort liegen die
// Bildableitungen von eleventy-img: 82 Quellbilder werden zu rund 900
// Dateien, und sie jedes Mal neu zu rechnen kostete dreieinhalb Minuten
// Bauzeit. eleventy-img überspringt, was schon da ist, also rechnet mit
// diesem Cache nur noch, was neu oder geändert ist.
//
// Eigenes Plugin statt netlify-plugin-cache: Das Paket kann dasselbe, ist
// aber seit Mai 2022 unverändert, und es ins Projekt zu holen hat die
// Lockfile an zwanzig Stellen umgeschrieben, die nichts damit zu tun hatten
// (libc-Felder von sharp und libvips). Die Netlify-Cache-API ist dieselbe,
// und sie ist hier vollständig benutzt.
const PFADE = [".cache"];

module.exports = {
    async onPreBuild({ utils: { cache } }) {
        if (await cache.restore(PFADE)) {
            const dateien = await cache.list(PFADE);
            console.log(`Cache geladen: ${dateien.length} Dateien aus ${PFADE.join(", ")}`);
        } else {
            console.log(`Kein Cache für ${PFADE.join(", ")} vorhanden, dieser Build rechnet alles.`);
        }
    },

    // Nur nach einem geglückten Build, damit ein halbfertiger Stand nicht
    // den guten Cache überschreibt.
    async onSuccess({ utils: { cache, status } }) {
        if (!(await cache.save(PFADE))) {
            console.log(`Cache konnte nicht gespeichert werden: ${PFADE.join(", ")}`);
            return;
        }
        const dateien = await cache.list(PFADE);
        console.log(`Cache gespeichert: ${dateien.length} Dateien`);
        status.show({
            title: `${dateien.length} Dateien im Cache`,
            summary: "Der nächste Build rechnet nur neue oder geänderte Bilder.",
            text: PFADE.join(", "),
        });
    },
};

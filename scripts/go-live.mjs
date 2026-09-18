// Knopfdruck für den Livegang der Tina-Migration, Abschnitte 3 und 5 der
// Checkliste (docs/superpowers/plans/2026-09-17-tina-umstellung-checkliste.md).
//
//   node scripts/go-live.mjs check      Probelauf: prüft alles, ändert nichts
//   node scripts/go-live.mjs switch     Abschnitt 3: umschalten
//   node scripts/go-live.mjs cleanup    Abschnitt 5: aufräumen
//
// Jeder Schritt erkennt selbst, ob er schon erledigt ist, also setzt ein
// neuer Lauf dort fort, wo der letzte angehalten hat. Das Skript hält an bei
// einem Merge-Konflikt, einer gescheiterten Prüfung und vor allem, was die
// Live-Seite berührt (Tags, Push auf main, Branches löschen). Bestätigt wird
// interaktiv mit j/N oder beim nächsten Lauf mit --ja=<schlüssel>, so kann
// auch Claude nach einer Rückfrage im Chat weitermachen.
//
// Weitere Optionen: --version=v2.1.0 setzt die Version des Releases (sonst
// die nächste Minor-Version).
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { spawn, spawnSync } from "node:child_process";
import { toMarketsAndEvents } from "./events-to-markets.mjs";

const BRANCH = "feat/tinacloud-migration";
const CLEANUP_BRANCH = "chore/aufraeumen-nach-tina";
const LIVE = "https://matthewfreed.ca";
const previewOf = (branch) => `https://${branch.replace(/[^a-z0-9]+/gi, "-")}--mf-pottery.netlify.app`;
const CHECKLIST = "docs/superpowers/plans/2026-09-17-tina-umstellung-checkliste.md";
const EVENTS = "src/views/_data/events.json";

// Decap schreibt diese Dateien auf main noch; auf dem Branch steckt ihr
// Inhalt anderswo. Ändert Matthew sie vor der Inhaltssperre, muss die
// Änderung von Hand hinüber.
const MOVED = {
    "src/views/_data/faq.json": "src/views/faq.md (questions)",
    "src/views/_data/news.json": "src/views/events.md (Studio news)",
    "src/views/_data/seo.json": "src/views/_data/global.json (seo)",
    "src/views/_data/showcase.json": "src/views/home.md (shop_sets, ersetzt die alten Shop-Artikel)",
};

const ARCHIVE_REMOTE = ["feat/tinacms-migration", "feat/sveltia-cms-migration"];
const ARCHIVE_LOCAL = ["decap", "master", "feat/sveltia-cms-migration", "feat/tinacms-migration"];

const argv = process.argv.slice(2);
const command = argv.find((a) => !a.startsWith("--"));
const approved = new Set(argv.filter((a) => a.startsWith("--ja=")).flatMap((a) => a.slice(5).split(",")));
const versionArg = argv.find((a) => a.startsWith("--version="))?.slice(10);
// Der Probelauf fragt nichts und committet nichts, er meldet nur.
const dryRun = command === "check";

// ---------------------------------------------------------------- Ausgabe

class Stop extends Error {
    constructor(message, hint, code = 2) {
        super(message);
        this.hint = hint;
        this.code = code;
    }
}

let stepNo = 0;
const log = (s = "") => console.log(s);
const heading = (s) => log(`\n▶ ${++stepNo}. ${s}`);
const ok = (s) => log(`  ✓ ${s}`);
const skip = (s) => log(`  – ${s}`);
const warn = (s) => log(`  ! ${s}`);

async function confirm(key, question) {
    if (dryRun) {
        warn(`würde hier fragen (--ja=${key}): ${question}`);
        return;
    }
    if (approved.has(key)) {
        ok(`bestätigt (--ja=${key}): ${question}`);
        return;
    }
    if (process.stdin.isTTY) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await rl.question(`  ? ${question} [j/N] `);
        rl.close();
        if (/^j(a)?$/i.test(answer.trim())) return;
        throw new Stop("Nicht bestätigt.", "Nichts weiter geändert. Später einfach erneut starten.", 1);
    }
    throw new Stop(`Bestätigung nötig: ${question}`, `Nach der Zustimmung erneut starten mit --ja=${key}`, 3);
}

// ---------------------------------------------------------------- Git und Prozesse

function git(...args) {
    const res = spawnSync("git", args, { encoding: "utf8" });
    if (res.status !== 0) throw new Stop(`git ${args.join(" ")} ist gescheitert`, (res.stderr || res.stdout).trim(), 1);
    return res.stdout.trim();
}
const gitOk = (...args) => spawnSync("git", args, { encoding: "utf8" }).status === 0;

// npm und npx sind unter Windows .cmd-Dateien und brauchen eine Shell.
function run(label, cmd, args) {
    const res = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
    if (res.status !== 0) throw new Stop(`${label} ist gescheitert`, `Ausgabe oben prüfen, beheben, committen und erneut starten.`, 1);
    ok(label);
}

const currentBranch = () => git("rev-parse", "--abbrev-ref", "HEAD");
const trackedChanges = () => git("status", "--porcelain", "--untracked-files=no");
const isAncestor = (a, b) => gitOk("merge-base", "--is-ancestor", a, b);
const remoteBranchExists = (b) => gitOk("rev-parse", "--verify", "--quiet", `refs/remotes/origin/${b}`);
const localBranchExists = (b) => gitOk("rev-parse", "--verify", "--quiet", `refs/heads/${b}`);
const tagExists = (t) => gitOk("rev-parse", "--verify", "--quiet", `refs/tags/${t}`);

function requireCleanTree() {
    if (fs.existsSync(path.join(git("rev-parse", "--git-dir"), "MERGE_HEAD"))) {
        const conflicted = git("diff", "--name-only", "--diff-filter=U");
        throw new Stop(
            "Ein Merge ist noch offen.",
            conflicted
                ? `Konflikte lösen in:\n${conflicted.split("\n").map((f) => `    ${f}`).join("\n")}\n  dann git add <datei>, git commit, erneut starten. Abbrechen: git merge --abort`
                : "Alle Konflikte sind gelöst: git commit, dann erneut starten.",
        );
    }
    const changes = trackedChanges();
    if (changes) throw new Stop("Es gibt uncommittete Änderungen.", `Erst committen oder verwerfen:\n${changes}`);
}

function checkout(branch) {
    if (currentBranch() !== branch) git("checkout", "-q", branch);
}

// ---------------------------------------------------------------- Netz

const env = (() => {
    const out = { ...process.env };
    if (fs.existsSync(".env")) {
        for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
            const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
            if (m && !out[m[1]]) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
        }
    }
    return out;
})();
const CLIENT_ID = env.NEXT_PUBLIC_TINA_CLIENT_ID || "70c9fe54-ade8-4e7d-b8de-e44bc1d0f0bb";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "cache-control": "no-cache" } });
        return { status: res.status, text: await res.text(), url: res.url };
    } catch (err) {
        return { status: 0, text: "", error: err.message };
    }
}

// Der Token wird nie ausgegeben, nur mitgeschickt.
async function tinaStatus(branch) {
    try {
        const res = await fetch(`https://content.tinajs.io/db/${CLIENT_ID}/status/${encodeURIComponent(branch)}`, {
            headers: { "X-API-KEY": env.TINA_TOKEN || "" },
            signal: AbortSignal.timeout(15000),
        });
        const body = await res.json().catch(() => ({}));
        return { http: res.status, status: body.status, sha: body.sha };
    } catch (err) {
        return { http: 0, error: err.message };
    }
}

// Jeder Build veröffentlicht seinen Commit unter /build.txt (src/views/build.njk).
async function waitForDeploy(base, sha, minutes = 20) {
    const until = Date.now() + minutes * 60000;
    process.stdout.write(`  … warte auf den Deploy von ${sha.slice(0, 7)} auf ${base} `);
    while (Date.now() < until) {
        const res = await get(`${base}/build.txt?t=${Date.now()}`);
        if (res.status === 200 && res.text.trim() === sha) {
            process.stdout.write("\n");
            ok(`Deploy von ${sha.slice(0, 7)} ist online`);
            return;
        }
        process.stdout.write(".");
        await sleep(20000);
    }
    process.stdout.write("\n");
    throw new Stop(
        `Nach ${minutes} Minuten ist ${sha.slice(0, 7)} nicht online.`,
        "Im Netlify-Dashboard nachsehen, ob der Build gescheitert ist. Die bisherige Fassung bleibt so lange online.",
        1,
    );
}

async function waitForTina(branch, sha, minutes = 10) {
    const until = Date.now() + minutes * 60000;
    let last;
    while (Date.now() < until) {
        last = await tinaStatus(branch);
        if (last.http === 403 || last.http === 401) break;
        if (last.status === "complete" && (!sha || last.sha === sha)) {
            ok(`TinaCloud hat ${branch} indexiert (${(last.sha || "").slice(0, 7)})`);
            return;
        }
        if (last.status === "failed") break;
        await sleep(15000);
    }
    throw new Stop(
        `TinaCloud meldet für ${branch}: ${last?.status || `HTTP ${last?.http}`}.`,
        "In app.tina.io unter Configuration den Branch prüfen, ggf. „Reindex“ klicken, dann erneut starten.",
        1,
    );
}

// ---------------------------------------------------------------- Prüfungen

async function tokenCoversMain() {
    if (!env.TINA_TOKEN) throw new Stop("Kein TINA_TOKEN gefunden.", "In .env eintragen (nie committen) oder als Umgebungsvariable setzen.");
    const res = await tinaStatus("main");
    if (res.http === 401 || res.http === 403) {
        throw new Stop(
            "Der TINA_TOKEN darf main nicht lesen.",
            "Abschnitt 2 der Checkliste: in TinaCloud ein Content-Token für main (besser *) anlegen, in .env und in Netlify eintragen.",
        );
    }
    ok(`TINA_TOKEN darf main lesen (TinaCloud: ${res.status || "noch nicht indexiert"})`);
}

async function roundTrips() {
    const API = "http://localhost:4001/graphql";
    const up = async () => (await get(API)).status > 0;
    let child;
    if (!(await up())) {
        log("  … starte tinacms dev für die Round-Trips");
        child = spawn("npx", ["tinacms", "dev"], { shell: process.platform === "win32", stdio: "ignore" });
        const until = Date.now() + 180000;
        while (!(await up())) {
            if (Date.now() > until) throw new Stop("tinacms dev antwortet nicht auf Port 4001.", "Von Hand mit npm run tina:dev starten und erneut versuchen.", 1);
            await sleep(3000);
        }
    }
    try {
        const schema = JSON.parse(fs.readFileSync("tina/__generated__/_schema.json", "utf8"));
        for (const c of schema.collections) {
            const file = `${c.match.include}.${c.format}`;
            const res = spawnSync("node", ["scripts/tina-roundtrip.mjs", c.name, file], { encoding: "utf8" });
            if (res.status !== 0) throw new Stop(`Round-Trip ${c.name} ist gescheitert`, (res.stderr || res.stdout).trim().slice(0, 2000), 1);
        }
        ok(`Round-Trip über alle ${schema.collections.length} Collections`);
    } finally {
        if (child) {
            if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
            else child.kill();
        }
        // Der Round-Trip über GraphQL umgeht beforeSubmit (Leerzeile im
        // Datenschutz); die Prüfung vergleicht getrimmt, die Datei wird
        // zurückgesetzt.
        spawnSync("git", ["checkout", "--", "src/views"], { stdio: "ignore" });
    }
    if (gitOk("diff", "--quiet", "--", "tina/tina-lock.json")) return;
    if (dryRun) {
        spawnSync("git", ["checkout", "--", "tina/tina-lock.json"], { stdio: "ignore" });
        warn("tina-lock.json ist veraltet: der Netlify-Build würde scheitern (beim Umschalten wird sie neu committet)");
        return;
    }
    git("add", "tina/tina-lock.json");
    git("commit", "-q", "-m", "chore(tina): tina-lock.json neu erzeugt");
    warn("tina-lock.json war veraltet und ist jetzt neu committet");
}

async function shopCheck() {
    const res = spawnSync("node", ["scripts/shop-check.mjs", "--strict"], { encoding: "utf8" });
    const summary = res.stdout.trim().split("\n").slice(-2).join("\n    ");
    if (res.status === 0) {
        ok(`Shop-Abgleich: ${summary}`);
        return;
    }
    warn(`Shop-Abgleich meldet Abweichungen:\n    ${summary}`);
    await confirm("preise", "Preise oder Links weichen vom Shop ab (Übersicht in reports/shop-check.html). Trotzdem weiter?");
}

// Vergleicht die Vorschau mit der Live-Seite und blendet aus, was die
// Migration absichtlich ändert. Was übrig bleibt, ist entweder ein
// vergessener Inhalt aus main oder ein Fehler.
const normalize = (html) =>
    html
        .replace(/<section[^>]*about-more-title[\s\S]*?<\/section>/g, "")
        .replace(/<section[^>]*aria-label="From the current firing"[\s\S]*?<\/section>/g, "")
        .replace(/<noscript><style>section\[data-firing-first\][\s\S]*?<\/noscript>/g, "")
        .replace(/<script>\s*\(function \(\) \{\s*var sets[\s\S]*?<\/script>/g, "")
        .replace(/<a[^>]*href=['"]\/about\/pottery(\.html)?['"][^>]*>[^<]*<\/a>/g, "")
        .replace(/<link[^>]*fonts\.googleapis\.com\/css2[^>]*>/g, "")
        .replace(/\/(assets|images\/share)\/blue-arrangement\.jpg/g, "/SHARE-IMAGE")
        .replace(/\/images\/[A-Za-z0-9_-]{10}-\d+\.(avif|webp|jpe?g|png)/g, "/images/HASH")
        .replace(/\s+/g, " ")
        .replace(/'/g, '"')
        .replace(/ >/g, ">")
        .replace(/> </g, "><")
        .trim();

async function comparePreviewWithLive(preview) {
    const sitemap = await get(`${LIVE}/sitemap.xml`);
    const paths = [...sitemap.text.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
    if (!paths.length) throw new Stop("Die Sitemap der Live-Seite ist leer oder nicht erreichbar.", `${LIVE}/sitemap.xml prüfen.`, 1);
    const differing = [];
    for (const p of paths) {
        const [live, prev] = await Promise.all([get(LIVE + p), get(preview + p)]);
        if (prev.status !== 200) {
            differing.push(`${p}: Vorschau antwortet mit ${prev.status}`);
            continue;
        }
        const a = normalize(live.text);
        const b = normalize(prev.text);
        if (a === b) continue;
        let i = 0;
        while (a[i] === b[i]) i++;
        differing.push(`${p}\n      live:     …${a.slice(Math.max(0, i - 50), i + 80)}\n      vorschau: …${b.slice(Math.max(0, i - 50), i + 80)}`);
    }
    if (!differing.length) {
        ok(`Vorschau gleich Live auf allen ${paths.length} Seiten (bis auf die gewollten Änderungen)`);
        return;
    }
    warn(`Vorschau weicht auf ${differing.length} von ${paths.length} Seiten ab:\n    ${differing.join("\n    ")}`);
    await confirm("vergleich", "Sind alle Abweichungen gewollt?");
}

// ---------------------------------------------------------------- Schritte: Umschalten

async function syncBranch() {
    heading(`Branch ${BRANCH} auf den Stand von GitHub bringen`);
    checkout(BRANCH);
    git("fetch", "-q", "--prune", "origin");
    // Jede Speicherung im Tina-Admin ist ein Commit auf GitHub.
    if (!isAncestor(`origin/${BRANCH}`, "HEAD")) {
        if (!isAncestor("HEAD", `origin/${BRANCH}`)) {
            throw new Stop(`${BRANCH} und origin/${BRANCH} sind auseinandergelaufen.`, `git pull --rebase origin ${BRANCH}, prüfen, erneut starten.`);
        }
        git("merge", "-q", "--ff-only", `origin/${BRANCH}`);
        ok("Commits aus dem Tina-Admin übernommen");
    } else ok("aktuell");
}

// Matthews Decap-Stand aus main kommt in den Branch, nicht umgekehrt.
async function mergeMain() {
    heading("main in den Branch mergen (Matthews Decap-Änderungen)");
    if (isAncestor("origin/main", "HEAD")) {
        skip("main ist schon enthalten");
        return;
    }
    const base = git("merge-base", "HEAD", "origin/main");
    const changedOnMain = git("diff", "--name-only", base, "origin/main").split("\n").filter(Boolean);
    log(`  main hat seitdem ${changedOnMain.length} Datei(en) geändert:\n${changedOnMain.map((f) => `    ${f}`).join("\n")}`);

    const moved = changedOnMain.filter((f) => MOVED[f]);
    if (moved.length) {
        throw new Stop(
            "Matthew hat in Decap Dateien geändert, deren Inhalt auf dem Branch woanders liegt.",
            moved.map((f) => `${f} → von Hand übernehmen nach ${MOVED[f]}\n    Änderung ansehen: git diff ${base.slice(0, 7)} origin/main -- ${f}`).join("\n  ") +
                "\n  Übernehmen, committen, dann die Datei beim Merge mit git rm entfernen. Danach erneut starten.",
        );
    }

    // events.json hat auf dem Branch eine andere Form (Märkte und Events).
    // Hat der Branch dort nichts Eigenes geändert, gewinnt Matthews Fassung
    // aus main und wird anschließend neu umgewandelt.
    let takeMainEvents = false;
    if (changedOnMain.includes(EVENTS)) {
        const baseEvents = JSON.parse(git("show", `${base}:${EVENTS}`));
        const branchEvents = JSON.parse(fs.readFileSync(EVENTS, "utf8"));
        if (JSON.stringify(toMarketsAndEvents(baseEvents)) !== JSON.stringify(branchEvents)) {
            throw new Stop(
                "events.json wurde auf dem Branch und in main geändert.",
                `Beide Fassungen zusammenführen: git diff ${base.slice(0, 7)} origin/main -- ${EVENTS} zeigt Matthews Änderungen.`,
            );
        }
        takeMainEvents = true;
    }

    const res = spawnSync("git", ["merge", "--no-ff", "--no-commit", "origin/main"], { encoding: "utf8" });
    if (takeMainEvents) {
        fs.writeFileSync(EVENTS, git("show", `origin/main:${EVENTS}`) + "\n");
        git("add", EVENTS);
    }
    const conflicted = git("diff", "--name-only", "--diff-filter=U").split("\n").filter(Boolean);
    if (conflicted.length) {
        throw new Stop(
            "Merge-Konflikte.",
            `In diesen Dateien:\n${conflicted.map((f) => `    ${f}`).join("\n")}\n  Regel: Inhalte aus main (Matthew) gewinnen, Struktur und Code vom Branch.\n  Lösen, git add, git commit, dann erneut starten. Abbrechen: git merge --abort`,
        );
    }
    if (res.status !== 0 && !fs.existsSync(path.join(git("rev-parse", "--git-dir"), "MERGE_HEAD"))) {
        throw new Stop("git merge ist gescheitert.", (res.stderr || res.stdout).trim(), 1);
    }
    git("commit", "-q", "-m", "Merge main: Matthews Decap-Stand vor der Tina-Umstellung");
    ok("main gemergt");
}

async function convertEvents() {
    heading("events.json in Märkte und Events umwandeln");
    const data = JSON.parse(fs.readFileSync(EVENTS, "utf8"));
    const converted = toMarketsAndEvents(data);
    if (converted === data) {
        skip(`schon umgewandelt (${data.markets.length} Märkte, ${data.events.length} Events)`);
        return;
    }
    fs.writeFileSync(EVENTS, JSON.stringify(converted, null, 2) + "\n");
    git("add", EVENTS);
    git("commit", "-q", "-m", "chore(content): Matthews Events aus main in Märkte und Events umgewandelt");
    ok(`${converted.markets.length} Märkte, ${converted.events.length} Events`);
    for (const m of converted.markets) log(`    Markt  ${m.name}: ${m.dates.join(", ")}`);
    for (const e of converted.events) log(`    Event  ${e.name}: ${e.date}${e.end_date ? ` bis ${e.end_date}` : ""}`);
}

async function localChecks() {
    heading("Prüfungen auf dem Rechner");
    run("npm test", "npm", ["test", "--silent"]);
    run("Typecheck", "npm", ["run", "typecheck", "--silent"]);
    await roundTrips();
    await shopCheck();
}

async function pushBranchAndWait() {
    const head = git("rev-parse", "HEAD");
    if (git("rev-parse", `origin/${BRANCH}`) !== head) {
        git("push", "-q", "origin", BRANCH);
        ok(`${BRANCH} gepusht`);
    }
    await waitForDeploy(previewOf(BRANCH), head);
}

async function moveAdmin() {
    heading("Tina von /admin-tina/ nach /admin/, Decap entfernen");
    const config = fs.readFileSync("tina/config.ts", "utf8");
    if (/outputFolder:\s*"admin"/.test(config)) {
        skip("schon umgezogen");
        return;
    }
    const replaceOnce = (file, from, to) => {
        const text = fs.readFileSync(file, "utf8");
        if (!from.test(text)) throw new Stop(`${file}: erwartete Stelle nicht gefunden (${from}).`, "Datei von Hand anpassen, committen, erneut starten.", 1);
        fs.writeFileSync(file, text.replace(from, to));
    };
    replaceOnce("tina/config.ts", /[ \t]*\/\/ Decap still owns \/admin until the cutover\.\r?\n/, "");
    replaceOnce("tina/config.ts", /outputFolder:\s*"admin-tina"/, 'outputFolder: "admin"');
    replaceOnce(".eleventy.js", /[ \t]*eleventyConfig\.addPassthroughCopy\(\{ "src\/admin" : "admin"\}\);\r?\n/, "");
    const redirects = fs.readFileSync("src/_redirects", "utf8");
    if (!redirects.includes("/admin-tina/")) {
        fs.writeFileSync("src/_redirects", redirects.replace(/\s*$/, "\n") + "\n# Tina lag bis zur Umstellung unter /admin-tina/.\n/admin-tina/*          /admin/                     301\n");
    }
    git("rm", "-r", "-q", "src/admin");
    git("add", "tina/config.ts", ".eleventy.js", "src/_redirects");
    git("commit", "-q", "-m", "feat(cms): Tina zieht nach /admin/, Decap entfällt");
    ok("umgezogen und committet");
}

async function checkPreviewAdmin() {
    const preview = previewOf(BRANCH);
    const admin = await get(`${preview}/admin/index.html`);
    if (admin.status !== 200 || !admin.text.includes("<title>TinaCMS</title>")) {
        throw new Stop(`${preview}/admin/ zeigt nicht Tina (HTTP ${admin.status}).`, "Netlify-Build-Log prüfen.", 1);
    }
    const decap = await get(`${preview}/admin/config.yml`);
    if (decap.status === 200) throw new Stop("Decaps config.yml wird noch ausgeliefert.", "src/admin und den Passthrough prüfen.", 1);
    ok("Vorschau: /admin/ ist Tina, Decap ist weg");
}

function nextVersion(latest, part) {
    const [maj, min, pat] = latest.replace(/^v/, "").split(".").map(Number);
    return part === "patch" ? `v${maj}.${min}.${pat + 1}` : `v${maj}.${min + 1}.0`;
}

async function release() {
    heading("Live-Stand taggen, Branch nach main mergen und pushen");
    git("fetch", "-q", "origin");
    if (isAncestor(BRANCH, "origin/main")) {
        skip("main enthält den Branch schon");
        return;
    }
    // Hat jemand trotz Inhaltssperre in Decap gespeichert, muss main erst
    // wieder in den Branch.
    if (!isAncestor("origin/main", BRANCH)) {
        throw new Stop("main hat neue Commits, die im Branch fehlen (Inhaltssperre?).", "Erneut starten: das Skript merged main zuerst und prüft alles noch einmal.");
    }
    const latest = git("tag", "--list", "v*", "--sort=-v:refname").split("\n")[0];
    const liveTag = spawnSync("git", ["describe", "--tags", "--exact-match", "origin/main"], { encoding: "utf8" }).stdout.trim();
    const newLiveTag = liveTag ? null : nextVersion(latest, "patch");
    const version = versionArg || nextVersion(newLiveTag || latest, "minor");
    if (tagExists(version)) throw new Stop(`Tag ${version} gibt es schon.`, "Mit --version=vX.Y.Z eine andere Version wählen.");
    const commits = git("log", "--oneline", "--no-merges", `origin/main..${BRANCH}`).split("\n").length;

    log(`  Live-Stand:  ${liveTag ? `${liveTag} (schon getaggt)` : `${newLiveTag} (neuer Tag auf origin/main)`}`);
    log(`  Release:     ${version}, ${commits} Commits aus ${BRANCH}`);
    log(`  Danach baut Netlify matthewfreed.ca neu, und /admin/ ist Tina.`);
    await confirm("release", `Live-Stand taggen, ${BRANCH} nach main mergen, ${version} taggen und alles pushen?`);

    if (newLiveTag) {
        git("tag", "-a", newLiveTag, "origin/main", "-m", "Live-Stand vor der Tina-Umstellung (Decap)");
        git("push", "-q", "origin", newLiveTag);
        ok(`${newLiveTag} getaggt und gepusht`);
    }
    if (localBranchExists("main")) {
        checkout("main");
        git("merge", "-q", "--ff-only", "origin/main");
    } else git("checkout", "-q", "-b", "main", "origin/main");
    git("merge", "-q", "--no-ff", BRANCH, "-m", `Merge ${BRANCH}: Umstellung von Decap auf TinaCloud`);
    git("tag", "-a", version, "-m", `${version}: Umstellung auf TinaCloud`);
    git("push", "-q", "origin", "main");
    git("push", "-q", "origin", version);
    ok(`main und ${version} gepusht`);
}

async function afterRelease() {
    heading("Live-Seite und TinaCloud abwarten");
    const sha = git("rev-parse", "origin/main");
    await waitForDeploy(LIVE, sha);
    await waitForTina("main", sha);
    const admin = await get(`${LIVE}/admin/index.html`);
    if (admin.status !== 200 || !admin.text.includes("<title>TinaCMS</title>")) {
        throw new Stop(`${LIVE}/admin/ zeigt nicht Tina (HTTP ${admin.status}).`, "Netlify-Deploy prüfen. Rücksprung: siehe Checkliste, Abschnitt „Abbruch und Rücksprung“.", 1);
    }
    ok("matthewfreed.ca/admin/ ist Tina");
    for (const p of ["/", "/events.html", "/about/"]) {
        const res = await get(LIVE + p);
        if (res.status !== 200) throw new Stop(`${LIVE}${p} antwortet mit ${res.status}.`, "Netlify-Deploy prüfen.", 1);
    }
    ok("Startseite, Events und About antworten");
    log(`
  Umgeschaltet. Jetzt von Hand (Checkliste, Abschnitt 4):
    - Foto über Media in einen Unterordner hochladen, im Bildfeld wählen, Build abwarten
    - Matthew: /admin/ öffnen, eine Kleinigkeit speichern; Anleitung schicken
    - Nach ein paar Tagen: node scripts/go-live.mjs cleanup`);
}

// ---------------------------------------------------------------- Schritte: Aufräumen

async function cleanup() {
    heading("Voraussetzungen");
    requireCleanTree();
    git("fetch", "-q", "--prune", "origin");
    if (!/outputFolder:\s*"admin"/.test(git("show", "origin/main:tina/config.ts"))) {
        throw new Stop("Tina ist auf main noch nicht unter /admin/.", "Erst umschalten: node scripts/go-live.mjs switch");
    }
    if (!remoteBranchExists(CLEANUP_BRANCH)) throw new Stop(`origin/${CLEANUP_BRANCH} fehlt.`, "Der Branch mit den vorbereiteten Aufräum-Commits muss auf GitHub liegen.");
    ok("Tina läuft auf main, Aufräum-Branch liegt bereit");

    heading(`${CLEANUP_BRANCH} nach main mergen`);
    if (isAncestor(`origin/${CLEANUP_BRANCH}`, "origin/main")) {
        skip("schon auf main");
    } else {
        if (localBranchExists("main")) {
            checkout("main");
            git("merge", "-q", "--ff-only", "origin/main");
        } else git("checkout", "-q", "-b", "main", "origin/main");
        if (!isAncestor(`origin/${CLEANUP_BRANCH}`, "HEAD")) {
            const res = spawnSync("git", ["merge", "--no-ff", "-m", `Merge ${CLEANUP_BRANCH}: Decap- und Migrationsreste entfernt`, `origin/${CLEANUP_BRANCH}`], { encoding: "utf8" });
            if (res.status !== 0) {
                requireCleanTree();
                throw new Stop("git merge ist gescheitert.", (res.stderr || res.stdout).trim(), 1);
            }
            ok("lokal gemergt");
        }
        run("npm test", "npm", ["test", "--silent"]);
        run("Typecheck", "npm", ["run", "typecheck", "--silent"]);
        log(`  Entfernt werden: ${git("diff", "--stat", "origin/main", "HEAD").split("\n").pop().trim()}`);
        await confirm("aufraeumen", "Aufräum-Commits auf main pushen? (Netlify baut die Live-Seite neu)");
        git("push", "-q", "origin", "main");
        ok("main gepusht");
        await waitForDeploy(LIVE, git("rev-parse", "HEAD"));
        const [home, sets] = await Promise.all([get(`${LIVE}/`), get(`${LIVE}/preview-sets.html`)]);
        if (home.status !== 200 || !home.text.includes("data-firing-set")) throw new Stop("Die Startseite zeigt keine Shop-Sets mehr.", "Deploy prüfen; Rücksprung: git revert -m 1 HEAD, pushen.", 1);
        ok(`Startseite in Ordnung, Vergleichsseite ${sets.status === 404 ? "entfernt" : `antwortet noch mit ${sets.status}`}`);
    }

    heading("Alte Branches archivieren");
    const remote = ARCHIVE_REMOTE.filter(remoteBranchExists);
    const local = ARCHIVE_LOCAL.filter(localBranchExists).concat(
        git("branch", "--list", "backup*", "--format=%(refname:short)").split("\n").filter(Boolean),
    );
    if (!remote.length && !local.length) {
        skip("nichts mehr zu archivieren");
    } else {
        log(`  Auf GitHub (Tag archiv/<name> wird gepusht, dann der Branch gelöscht): ${remote.join(", ") || "–"}`);
        log(`  Nur lokal (Tag bleibt lokal, Branch wird gelöscht): ${local.join(", ") || "–"}`);
        await confirm("branches", "Diese Branches als Tag archivieren und löschen?");
        for (const b of remote) {
            const tag = `archiv/${b}`;
            if (!tagExists(tag)) git("tag", "-a", tag, `origin/${b}`, "-m", `Archiv: Branch ${b}`);
            git("push", "-q", "origin", tag);
            git("push", "-q", "origin", "--delete", b);
            ok(`${b} → ${tag}`);
        }
        for (const b of local) {
            // Hat der lokale Branch andere Commits als der gleichnamige auf
            // GitHub, bekommt er einen eigenen Tag.
            let tag = `archiv/${b}`;
            if (tagExists(tag) && git("rev-parse", `${tag}^{commit}`) !== git("rev-parse", b)) tag += "-lokal";
            if (!tagExists(tag)) git("tag", "-a", tag, b, "-m", `Archiv: Branch ${b}`);
            git("branch", "-q", "-D", b);
            ok(`${b} → ${tag} (lokal)`);
        }
    }

    log(`
  Aufgeräumt. Von Hand bleibt (Checkliste, Abschnitt 5):
    - Netlify-Dashboard: Identity und Git Gateway abschalten
    - Analytics-Testdateien im Repo-Wurzelverzeichnis einsortieren oder löschen:
      ${git("ls-files", "--others", "--exclude-standard", "--", "*.html", "*.js").split("\n").filter((f) => f && !f.includes("/")).join(", ") || "keine mehr"}`);
}

// ---------------------------------------------------------------- Befehle

async function check() {
    heading("Arbeitsstand");
    requireCleanTree();
    git("fetch", "-q", "--prune", "origin");
    ok(`Branch ${currentBranch()}, nichts Uncommittetes`);
    const ahead = git("rev-list", "--count", `HEAD..origin/${BRANCH}`);
    if (ahead !== "0") warn(`origin/${BRANCH} hat ${ahead} Commit(s) aus dem Tina-Admin, die lokal fehlen`);

    heading("Zugang zu TinaCloud");
    const branchStatus = await tinaStatus(BRANCH);
    ok(`${BRANCH}: ${branchStatus.status || `HTTP ${branchStatus.http}`}`);
    try {
        await tokenCoversMain();
    } catch (err) {
        if (!(err instanceof Stop)) throw err;
        warn(`${err.message} ${err.hint}`);
    }

    heading("Was main seit der letzten Zusammenführung geändert hat");
    if (isAncestor("origin/main", `origin/${BRANCH}`)) ok("nichts, main ist im Branch enthalten");
    else {
        const base = git("merge-base", `origin/${BRANCH}`, "origin/main");
        for (const f of git("diff", "--name-only", base, "origin/main").split("\n").filter(Boolean)) {
            log(`    ${f}${MOVED[f] ? `  ← von Hand nach ${MOVED[f]}` : f === EVENTS ? "  ← wird übernommen und umgewandelt" : ""}`);
        }
    }

    await localChecks();

    heading("Vorschau");
    const sha = git("rev-parse", `origin/${BRANCH}`);
    const deployed = (await get(`${previewOf(BRANCH)}/build.txt?t=${Date.now()}`)).text.trim();
    if (deployed === sha) ok(`Vorschau zeigt den letzten Commit (${sha.slice(0, 7)})`);
    else warn(`Vorschau zeigt ${deployed.slice(0, 7) || "keinen Commit"}, gepusht ist ${sha.slice(0, 7)} (Build läuft oder ist gescheitert)`);
    await comparePreviewWithLive(previewOf(BRANCH));
    log("\n  Probelauf fertig. Nichts wurde gepusht oder getaggt.");
}

async function switchOver() {
    heading("Voraussetzungen");
    requireCleanTree();
    await tokenCoversMain();
    git("fetch", "-q", "--prune", "origin");
    if (isAncestor(BRANCH, "origin/main")) {
        skip("der Branch ist schon auf main");
        await afterRelease();
        return;
    }
    await confirm("sperre", "Hat Matthew bestätigt, dass er ab jetzt nichts mehr in Decap speichert (Inhaltssperre)?");
    await syncBranch();
    await mergeMain();
    await convertEvents();
    await localChecks();
    heading("Vorschau bauen lassen und mit Live vergleichen");
    await pushBranchAndWait();
    await comparePreviewWithLive(previewOf(BRANCH));
    await moveAdmin();
    heading("Vorschau mit Tina unter /admin/");
    await pushBranchAndWait();
    await checkPreviewAdmin();
    await release();
    await afterRelease();
}

const commands = { check, switch: switchOver, cleanup };
if (!commands[command]) {
    console.log("Aufruf: node scripts/go-live.mjs check | switch | cleanup [--ja=<schlüssel>,…] [--version=vX.Y.Z]");
    console.log(`Ablauf und Hintergrund: ${CHECKLIST}`);
    process.exit(2);
}
try {
    await commands[command]();
} catch (err) {
    if (!(err instanceof Stop)) throw err;
    log(`\n⏸ Angehalten: ${err.message}`);
    if (err.hint) log(`  ${err.hint}`);
    process.exit(err.code);
}

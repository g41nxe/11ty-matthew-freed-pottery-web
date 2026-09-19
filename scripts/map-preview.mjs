// Makes the map picture on the contact page (ticket 0005). It comes from
// OpenStreetMap and is stored with the site, so opening the page contacts
// no map service; Google Maps is only a link. Run it again after the studio
// moves (the contact page hides the old picture until then):
//
//   npm run map:preview
//   npm run map:preview -- --lat=49.2799298 --lon=-123.0863028
//
// The second form skips the address search, for when it finds nothing.
// OpenStreetMap asks scripts to identify themselves and to download little:
// one address search and a handful of tiles per run, one at a time, and
// never during a build.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const ROOT = path.join(import.meta.dirname, "..");
const USER_AGENT = "matthewfreed.ca map preview script (+https://matthewfreed.ca)";
const TILE = 256;
const ZOOM = 16;
// Cut at the tiles' own resolution, then doubled: OpenStreetMap has no
// high-density tiles, and doubling keeps the street names readable.
const WIDTH = 720;
const HEIGHT = 304;
const SCALE = 2;
const PIN = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="16" fill="#1F3A52" stroke="#F8F5EE" stroke-width="6"/></svg>`;
const OUT_IMAGE = path.join(ROOT, "src", "images", "site", "studio-map.png");
const OUT_DATA = path.join(ROOT, "src", "views", "_data", "mapPreview.json");

// Web Mercator: where a coordinate lies, in pixels of the whole world map
// at this zoom level.
export function worldPixel(lat, lon, zoom) {
    const size = TILE * 2 ** zoom;
    const sin = Math.sin((lat * Math.PI) / 180);
    return {
        x: ((lon + 180) / 360) * size,
        y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
    };
}

// The tiles a picture of width × height needs when its pin, at half the
// width and pinY of the height, lands on the given world pixel; and where
// the picture starts inside the first tile.
export function tileWindow(center, width, height, pinY) {
    const left = Math.round(center.x - width / 2);
    const top = Math.round(center.y - height * pinY);
    const x0 = Math.floor(left / TILE);
    const y0 = Math.floor(top / TILE);
    return {
        x0,
        y0,
        x1: Math.floor((left + width - 1) / TILE),
        y1: Math.floor((top + height - 1) / TILE),
        offsetX: left - x0 * TILE,
        offsetY: top - y0 * TILE,
    };
}

async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`${res.status} for ${url}`);
    return res;
}

async function geocode(address) {
    const query = address.split("\n").map((line) => line.trim()).filter(Boolean).join(", ");
    const res = await get(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
    const [hit] = await res.json();
    if (!hit) throw new Error(`No match for "${query}". Pass --lat= and --lon= instead.`);
    return { lat: Number(hit.lat), lon: Number(hit.lon) };
}

async function main() {
    const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, "").split("=")));
    const global = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "views", "_data", "global.json"), "utf8"));
    const address = global.contact.address;
    const { lat, lon } = args.lat && args.lon ? { lat: Number(args.lat), lon: Number(args.lon) } : await geocode(address);

    const win = tileWindow(worldPixel(lat, lon, ZOOM), WIDTH, HEIGHT, 0.5);
    const tiles = [];
    for (let y = win.y0; y <= win.y1; y++) {
        for (let x = win.x0; x <= win.x1; x++) {
            const res = await get(`https://tile.openstreetmap.org/${ZOOM}/${x}/${y}.png`);
            tiles.push({ input: Buffer.from(await res.arrayBuffer()), left: (x - win.x0) * TILE, top: (y - win.y0) * TILE });
        }
    }
    const mosaic = await sharp({
        create: { width: (win.x1 - win.x0 + 1) * TILE, height: (win.y1 - win.y0 + 1) * TILE, channels: 3, background: "#ffffff" },
    }).composite(tiles).png().toBuffer();

    const picture = await sharp(mosaic)
        .extract({ left: win.offsetX, top: win.offsetY, width: WIDTH, height: HEIGHT })
        .resize(WIDTH * SCALE, HEIGHT * SCALE, { kernel: "lanczos3" })
        // Quiet the map into the site's paper palette; the pin keeps its colour.
        .modulate({ saturation: 0.25 })
        .composite([{ input: Buffer.from(PIN), left: (WIDTH * SCALE) / 2 - 24, top: (HEIGHT * SCALE) / 2 - 24 }])
        .png()
        .toBuffer();

    fs.writeFileSync(OUT_IMAGE, picture);
    const made = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(OUT_DATA, JSON.stringify({ address, lat, lon, zoom: ZOOM, made }, null, 2) + "\n");
    console.log(`Map picture for ${lat}, ${lon} written (${tiles.length} tiles).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}

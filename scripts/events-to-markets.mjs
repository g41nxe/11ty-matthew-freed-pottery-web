// Converts the flat event list Decap writes into markets and events (see
// CONTEXT.md). A market is every entry that is neither at the studio nor
// multi-day, grouped by name. Run it again at the cutover on Matthew's
// latest events.json from main; a converted file is left alone.
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const sortable = (date) => {
  const [month, day, year] = date.split("-");
  return `${year}-${month}-${day}`;
};

// Drop keys whose value is undefined so the JSON only holds filled fields,
// the way Tina writes it.
const compact = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));

export function toMarketsAndEvents(data) {
  if (Array.isArray(data.markets)) return data;

  const byName = new Map();
  const events = [];
  for (const entry of data.events ?? []) {
    const name = entry.name.trim();
    if (entry.atStudio || entry.multi_day_event) {
      events.push(compact({
        name,
        date: entry.date,
        end_date: entry.multi_day_event && entry.end_date ? entry.end_date : undefined,
        time: entry.time,
        location: entry.location,
        gmaps: entry.gmaps,
        description: entry.content?.body,
        at_studio: Boolean(entry.atStudio),
      }));
      continue;
    }
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(entry);
  }

  const markets = [...byName].map(([name, entries]) => {
    const sorted = [...entries].sort((a, b) => sortable(a.date).localeCompare(sortable(b.date)));
    for (const field of ["location", "time", "gmaps"]) {
      if (new Set(sorted.map((e) => e[field] ?? "")).size > 1) {
        throw new Error(`${name}: "${field}" differs between its dates; fix events.json by hand first`);
      }
    }
    const latest = sorted[sorted.length - 1];
    return compact({
      name,
      location: latest.location,
      time: latest.time,
      gmaps: latest.gmaps,
      description: latest.content?.body,
      dates: sorted.map((e) => e.date),
    });
  });

  return { markets, events };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  const converted = toMarketsAndEvents(JSON.parse(fs.readFileSync(file, "utf8")));
  fs.writeFileSync(file, JSON.stringify(converted, null, 2) + "\n");
  console.log(`${file}: ${converted.markets.length} markets, ${converted.events.length} events`);
}

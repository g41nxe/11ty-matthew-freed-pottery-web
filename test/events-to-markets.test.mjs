import test from "node:test";
import assert from "node:assert/strict";
import { toMarketsAndEvents } from "../scripts/events-to-markets.mjs";

const market = (date, extra = {}) => ({
  name: "Trout Lake Farmer's Market", date, time: "9 a.m. to 2 p.m.",
  location: "John Hendry Park", gmaps: "Trout Lake", multi_day_event: false, atStudio: false,
  content: { title: "Trout Lake", body: "Weekly market" }, ...extra,
});

test("groups a market's dates, sorted, with details from its latest date", () => {
  const result = toMarketsAndEvents({ events: [
    market("05-02-2026"),
    market("04-18-2026", { content: { body: "Old text" } }),
    market("10-17-2026", { name: "Trout Lake Farmer's Market ", content: { body: "Weekly market!" } }),
  ] });
  assert.deepEqual(result.markets, [{
    name: "Trout Lake Farmer's Market", location: "John Hendry Park", time: "9 a.m. to 2 p.m.",
    gmaps: "Trout Lake", description: "Weekly market!", dates: ["04-18-2026", "05-02-2026", "10-17-2026"],
  }]);
  assert.deepEqual(result.events, []);
});

test("keeps studio and multi-day entries as events", () => {
  const result = toMarketsAndEvents({ events: [
    { name: "Harmony Arts Festival", date: "08-07-2026", end_date: "08-09-2026", multi_day_event: true,
      time: "2pm", location: "Argyle Avenue", gmaps: "West Vancouver", atStudio: false,
      content: { title: "HAF", body: "Live music" } },
    { name: "Studio sale", date: "11-21-2026", end_date: "11-22-2026", multi_day_event: false,
      time: "10-4", location: "Studio", atStudio: true, content: {} },
  ] });
  assert.deepEqual(result.markets, []);
  assert.deepEqual(result.events, [
    { name: "Harmony Arts Festival", date: "08-07-2026", end_date: "08-09-2026", time: "2pm",
      location: "Argyle Avenue", gmaps: "West Vancouver", description: "Live music", at_studio: false },
    { name: "Studio sale", date: "11-21-2026", time: "10-4", location: "Studio", at_studio: true },
  ]);
});

test("leaves an already converted file alone", () => {
  const converted = { markets: [{ name: "X", dates: ["01-01-2027"] }], events: [] };
  assert.equal(toMarketsAndEvents(converted), converted);
});

test("refuses to merge a market whose dates disagree on the place", () => {
  assert.throws(
    () => toMarketsAndEvents({ events: [market("05-02-2026"), market("06-06-2026", { location: "Elsewhere" })] }),
    /Trout Lake Farmer's Market: "location" differs/,
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { DateTime } from "luxon";

// The filters live in .eleventy.js and are only reachable through the config
// object Eleventy passes in. A stub that answers every call and remembers the
// filters gets at them without moving code out of the config.
const require = createRequire(import.meta.url);
const filters = {};
const stub = new Proxy(
    { addNunjucksFilter: (name, fn) => { filters[name] = fn; } },
    { get: (target, prop) => target[prop] ?? (() => {}) }
);
require("../.eleventy.js")(stub);

const day = (offset) => DateTime.now().startOf("day").plus({ days: offset }).toFormat("MM-dd-yyyy");
const YESTERDAY = day(-1);
const TODAY = day(0);
const TOMORROW = day(1);
const NEXT_WEEK = day(7);

test("occurrences turns every market date into its own entry", () => {
    const data = {
        markets: [
            { name: "Trout Lake", location: "Vancouver", dates: [TOMORROW, NEXT_WEEK] },
            { name: "Kitsilano", location: "Vancouver", dates: [TODAY] },
        ],
        events: [{ name: "Harmony Arts", date: NEXT_WEEK }],
    };
    const result = filters.occurrences(data);

    assert.equal(result.length, 4);
    assert.deepEqual(
        result.map((e) => [e.name, e.date, e.market]),
        [
            ["Trout Lake", TOMORROW, "market-0"],
            ["Trout Lake", NEXT_WEEK, "market-0"],
            ["Kitsilano", TODAY, "market-1"],
            ["Harmony Arts", NEXT_WEEK, undefined],
        ]
    );
    // The details of the market ride along, the list of dates does not.
    assert.equal(result[0].location, "Vancouver");
    assert.equal("dates" in result[0], false);
});

test("occurrences copes with missing and empty dates", () => {
    const result = filters.occurrences({
        markets: [{ name: "Ohne Termine" }, { name: "Leerer Eintrag", dates: [TODAY, ""] }],
    });
    assert.deepEqual(result.map((e) => e.date), [TODAY]);
    assert.deepEqual(filters.occurrences({}), []);
});

test("filterUpcoming keeps today and drops yesterday", () => {
    const result = filters.filterUpcoming([
        { name: "Gestern", date: YESTERDAY },
        { name: "Heute", date: TODAY },
        { name: "Morgen", date: TOMORROW },
    ]);
    assert.deepEqual(result.map((e) => e.name), ["Heute", "Morgen"]);
});

test("filterUpcoming keeps a multi-day event while it runs", () => {
    const result = filters.filterUpcoming([
        { name: "Läuft gerade", date: YESTERDAY, end_date: TOMORROW },
        { name: "Vorbei", date: day(-3), end_date: YESTERDAY },
        { name: "Enddatum vor Beginn", date: YESTERDAY, end_date: day(-3) },
    ]);
    assert.deepEqual(result.map((e) => e.name), ["Läuft gerade"]);
});

test("filterUpcoming skips entries without a readable date instead of throwing", () => {
    const result = filters.filterUpcoming([
        { name: "Ohne Datum" },
        { name: "Leeres Datum", date: "" },
        { name: "Kaputtes Datum", date: "2026-10-04T00:00:00.000Z" },
        { name: "Kaputtes Enddatum", date: TODAY, end_date: "bald" },
        { name: "Morgen", date: TOMORROW },
    ]);
    assert.deepEqual(result.map((e) => e.name), ["Kaputtes Enddatum", "Morgen"]);
});

test("marketSchedule groups by market, not by name", () => {
    const schedule = filters.marketSchedule([
        { name: "Trout Lake", date: NEXT_WEEK, market: "market-0" },
        { name: "Trout Lake", date: TOMORROW, market: "market-0" },
        // Same name, different market: stays its own group.
        { name: "Trout Lake", date: TODAY, market: "market-1" },
        { name: "Einzelevent", date: TODAY },
    ]);

    assert.equal(schedule.length, 2);
    assert.deepEqual(schedule[0].dates, [TODAY]);
    assert.equal(schedule[0].first.market, "market-1");
    assert.deepEqual(schedule[1].dates, [TOMORROW, NEXT_WEEK]);
    assert.equal(schedule[1].first.date, TOMORROW, "first is the next date of that market");
});

test("specialEvents keeps everything without a market, soonest first", () => {
    const events = filters.specialEvents([
        { name: "Später", date: NEXT_WEEK },
        { name: "Markttermin", date: TODAY, market: "market-0" },
        { name: "Früher", date: TOMORROW },
    ]);
    assert.deepEqual(events.map((e) => e.name), ["Früher", "Später"]);
});

test("nextUp lists each name once, with its next date", () => {
    const shortlist = filters.nextUp([
        { name: "Trout Lake ", date: NEXT_WEEK },
        { name: "Trout Lake", date: TOMORROW },
        { name: "Kitsilano", date: TODAY },
    ]);
    assert.deepEqual(
        shortlist.map((e) => [e.name.trim(), e.date]),
        [["Kitsilano", TODAY], ["Trout Lake", TOMORROW]]
    );
});

test("byDateAsc sorts a copy and leaves the original alone", () => {
    const input = [{ date: NEXT_WEEK }, { date: TODAY }];
    const sorted = filters.byDateAsc(input);
    assert.deepEqual(sorted.map((e) => e.date), [TODAY, NEXT_WEEK]);
    assert.deepEqual(input.map((e) => e.date), [NEXT_WEEK, TODAY]);
});

test("date formats MM-DD-YYYY and survives an empty field", () => {
    assert.equal(filters.date("10-04-2026", "LLL d, yyyy"), "Oct 4, 2026");
    assert.equal(filters.date("", "LLL d, yyyy"), "");
    assert.equal(filters.date(undefined, "LLL d, yyyy"), "");
});

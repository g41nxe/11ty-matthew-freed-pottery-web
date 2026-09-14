import type { Collection } from "tinacms";

// Dates stay "MM-DD-YYYY", the format every date filter in .eleventy.js
// reads. Task 3 of the Durchstich decides whether a date picker replaces
// this text field.
const usDate = (value?: string) =>
  value && !/^\d{2}-\d{2}-\d{4}$/.test(value)
    ? "Use MM-DD-YYYY, for example 10-04-2026"
    : undefined;

// The list label Matthew scans for. Parsed in the editor's browser, so it
// shows his calendar day for both "MM-DD-YYYY" and ISO values.
export const dayLabel = (value?: string): string => {
  if (!value) return "";
  const day = new Date(value);
  return isNaN(day.getTime())
    ? value
    : day.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
};

export const events: Collection = {
  name: "events",
  label: "Events",
  path: "src/views/_data",
  format: "json",
  match: { include: "events" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    {
      type: "object",
      name: "events",
      label: "Event list",
      list: true,
      ui: {
        itemProps: (item) => ({
          label: [dayLabel(item?.date), item?.name].filter(Boolean).join(" · ") || "New event",
        }),
        defaultItem: { multi_day_event: false, atStudio: false },
      },
      fields: [
        { type: "boolean", name: "multi_day_event", label: "Is it a multi day event?" },
        { type: "string", name: "date", label: "Date", required: true, description: "MM-DD-YYYY", ui: { validate: usDate } },
        { type: "string", name: "end_date", label: "End date", description: "MM-DD-YYYY, only for multi day events", ui: { validate: usDate } },
        { type: "string", name: "time", label: "Time" },
        { type: "string", name: "name", label: "Name", required: true },
        { type: "string", name: "location", label: "Location" },
        {
          type: "object",
          name: "content",
          label: "Content",
          fields: [
            { type: "string", name: "title", label: "Title (not shown on the website)" },
            { type: "string", name: "body", label: "Description", ui: { component: "textarea" } },
          ],
        },
        { type: "string", name: "gmaps", label: "Location on Google Maps" },
        { type: "boolean", name: "atStudio", label: "Takes place at my studio" },
      ],
    },
  ],
};

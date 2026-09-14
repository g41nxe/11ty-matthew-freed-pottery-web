import type { Collection } from "tinacms";

// Dates stay "MM-DD-YYYY", the format every date filter in .eleventy.js
// reads.
const US_DATE = /^(\d{2})-(\d{2})-(\d{4})$/;

const usDate = (value: string) =>
  value && !US_DATE.test(value)
    ? "Use MM-DD-YYYY, for example 10-04-2026"
    : undefined;

// "10-04-2026" -> "2026-10-04T00:00:00", which every browser reads as local
// midnight (Safari rejects "10-04-2026" itself).
const fromUsDate = (value: string): string => {
  const m = value?.match(US_DATE);
  return m ? `${m[3]}-${m[1]}-${m[2]}T00:00:00` : value;
};

// Tina's date picker hands over an ISO timestamp: local midnight when an
// existing date is changed, the current clock time when the field was
// empty. Either way the editor's browser shows the day they picked, so only
// that calendar day is kept and no timezone ever reaches the file.
const pad = (n: number) => String(n).padStart(2, "0");
const toUsDate = (value: string): string => {
  if (!value || US_DATE.test(value)) return value;
  const day = new Date(value);
  return isNaN(day.getTime())
    ? value
    : `${pad(day.getMonth() + 1)}-${pad(day.getDate())}-${day.getFullYear()}`;
};

// A string field, not "datetime": Tina's server would rewrite every date in
// the file to an ISO timestamp in its own timezone.
const datePicker = {
  component: "date",
  dateFormat: "MM-DD-YYYY",
  parse: toUsDate,
  format: fromUsDate,
  validate: usDate,
};

// The list label Matthew scans for.
export const dayLabel = (value?: string): string => {
  if (!value) return "";
  const day = new Date(fromUsDate(value));
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
        { type: "string", name: "date", label: "Date", required: true, ui: datePicker },
        // required: false explicitly: otherwise clearing the picker fills in today.
        { type: "string", name: "end_date", label: "End date", description: "Only for multi day events", required: false, ui: datePicker },
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

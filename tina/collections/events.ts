import type { Collection } from "tinacms";
import { dateList, datePicker, dayLabel } from "../fields/date";

// Field order matches the order scripts/events-to-markets.mjs writes, so a
// first save does not reorder every entry.
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
      name: "markets",
      label: "Markets",
      list: true,
      ui: { itemProps: (item) => ({ label: item?.name || "New market" }) },
      fields: [
        { type: "string", name: "name", label: "Name", required: true },
        { type: "string", name: "location", label: "Location" },
        { type: "string", name: "time", label: "Time" },
        { type: "string", name: "gmaps", label: "Location on Google Maps" },
        { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
        { type: "string", name: "dates", label: "Dates", list: true, ui: dateList },
      ],
    },
    {
      type: "object",
      name: "events",
      label: "Events",
      description: "One-off and multi-day events, shown under “Special events”",
      list: true,
      ui: {
        itemProps: (item) => ({
          label: [dayLabel(item?.date), item?.name].filter(Boolean).join(" · ") || "New event",
        }),
        defaultItem: { at_studio: false },
      },
      fields: [
        { type: "string", name: "name", label: "Name", required: true },
        { type: "string", name: "date", label: "Date", required: true, ui: datePicker },
        { type: "string", name: "end_date", label: "End date", description: "Only for multi day events", required: false, ui: datePicker },
        { type: "string", name: "time", label: "Time" },
        { type: "string", name: "location", label: "Location" },
        { type: "string", name: "gmaps", label: "Location on Google Maps" },
        { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
        { type: "boolean", name: "at_studio", label: "Takes place at my studio" },
      ],
    },
  ],
};

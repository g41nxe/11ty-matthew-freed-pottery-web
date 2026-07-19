import type { Collection } from "tinacms";

export const eventsPage: Collection = {
  name: "events_page",
  label: "Events Page",
  path: "src/views",
  format: "md",
  match: { include: "events" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [{ type: "string", name: "placeholder", label: "Placeholder" }],
};

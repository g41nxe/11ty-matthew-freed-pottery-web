import type { Collection } from "tinacms";

export const events: Collection = {
  name: "events",
  label: "Events",
  path: "src/content/events",
  format: "md",
  ui: { allowedActions: { create: true, delete: true } },
  fields: [{ type: "string", name: "__placeholder", label: "placeholder" }],
};

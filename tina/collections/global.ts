import type { Collection } from "tinacms";

export const global: Collection = {
  name: "global",
  label: "Global Settings",
  path: "src/views/_data",
  format: "json",
  match: { include: "global" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [{ type: "string", name: "__placeholder", label: "placeholder" }],
};

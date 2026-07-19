import type { Collection } from "tinacms";

export const retail: Collection = {
  name: "retail",
  label: "Retail Stores",
  path: "src/views",
  format: "md",
  match: { include: "retail-stores" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [{ type: "string", name: "placeholder", label: "Placeholder" }],
};

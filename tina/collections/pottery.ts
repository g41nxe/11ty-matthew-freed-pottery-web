import type { Collection } from "tinacms";

export const pottery: Collection = {
  name: "pottery",
  label: "Pottery",
  path: "src/views",
  format: "md",
  match: { include: "pottery" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [{ type: "string", name: "placeholder", label: "Placeholder" }],
};

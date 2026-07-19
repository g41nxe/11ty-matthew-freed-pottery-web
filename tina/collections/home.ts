import type { Collection } from "tinacms";

export const home: Collection = {
  name: "home",
  label: "Home",
  path: "src/views",
  format: "md",
  match: { include: "home" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [{ type: "string", name: "placeholder", label: "Placeholder" }],
};

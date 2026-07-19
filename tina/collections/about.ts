import type { Collection } from "tinacms";

export const about: Collection = {
  name: "about",
  label: "About",
  path: "src/views",
  format: "md",
  match: { include: "about" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [{ type: "string", name: "__placeholder", label: "placeholder" }],
};

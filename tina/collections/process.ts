import type { Collection } from "tinacms";

export const process_: Collection = {
  name: "process",
  label: "Process",
  path: "src/views",
  format: "md",
  match: { include: "process" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [{ type: "string", name: "__placeholder", label: "placeholder" }],
};

import type { Collection } from "tinacms";
import { sectionsField } from "../fields/sections";

// Exported as processPage: an export named `process` would shadow Node's
// process in tina/config.ts.
export const processPage: Collection = {
  name: "process",
  label: "Process",
  path: "src/views",
  format: "md",
  match: { include: "process" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "eyebrow", label: "Eyebrow" },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
    { type: "string", name: "quote", label: "Pull quote (shown after the first section)", ui: { component: "textarea" } },
    sectionsField,
  ],
};

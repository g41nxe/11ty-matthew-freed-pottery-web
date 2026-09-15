import type { Collection } from "tinacms";
import { sectionsField } from "../fields/sections";

export const pottery: Collection = {
  name: "pottery",
  label: "Pottery",
  path: "src/views",
  format: "md",
  match: { include: "pottery" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
    sectionsField,
  ],
};

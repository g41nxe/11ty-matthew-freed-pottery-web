import type { Collection } from "tinacms";
import { sectionsField } from "../fields/sections";

export const aboutProcessPage: Collection = {
  name: "about_process_page",
  label: "About · Process page",
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

import type { Collection } from "tinacms";
import { sectionsField } from "../fields/sections";

// layout, tags, permalink and eleventyNavigation stay in the file untouched:
// Tina keeps top-level frontmatter it has no field for.
export const aboutPage: Collection = {
  name: "about_page",
  label: "About · Page",
  path: "src/views",
  format: "md",
  match: { include: "about" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "eyebrow", label: "Eyebrow" },
    {
      type: "object",
      name: "medal",
      label: "Award note (leave the text empty to hide the whole block)",
      fields: [
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
        { type: "string", name: "link_label", label: "Shop link text" },
      ],
    },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
    { type: "string", name: "quote", label: "Pull quote (shown after the first section)", ui: { component: "textarea" } },
    sectionsField,
  ],
};

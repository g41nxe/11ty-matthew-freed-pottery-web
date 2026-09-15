import type { Collection } from "tinacms";

export const privacy: Collection = {
  name: "privacy",
  label: "Privacy statement",
  path: "src/views",
  format: "md",
  match: { include: "privacy-statement" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
    // Markdown source instead of rich-text: the rich-text editor rewrites the
    // file on its first save (list markers, trailing spaces) and turns the
    // bare cookie URL into a link, which changes the published page.
    { type: "string", name: "body", label: "Text (Markdown)", isBody: true, ui: { component: "textarea" } },
  ],
};

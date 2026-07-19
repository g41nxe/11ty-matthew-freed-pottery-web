import type { Collection } from "tinacms";

export const seo: Collection = {
  name: "seo",
  label: "SEO Settings",
  path: "src/views/_data",
  format: "json",
  match: { include: "seo" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
    { type: "string", name: "url", label: "URL" },
    { type: "string", name: "author", label: "Author" },
    { type: "image", name: "image", label: "Image" },
    {
      type: "object", name: "options", label: "Options",
      fields: [{ type: "string", name: "titleDivider", label: "Title Divider" }],
    },
  ],
};

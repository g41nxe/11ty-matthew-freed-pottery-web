import type { Collection } from "tinacms";

export const seo: Collection = {
  name: "seo",
  label: "SEO",
  path: "src/views/_data",
  format: "json",
  match: { include: "seo" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
    { type: "string", name: "url", label: "Site URL (no trailing slash)" },
    { type: "string", name: "author", label: "Author" },
    { type: "image", name: "image", label: "Social share image" },
    {
      type: "object", name: "options", label: "Options",
      fields: [
        { type: "string", name: "titleDivider", label: "Title divider" },
        // Required for absolute share-image URLs; kept in the file, not shown.
        { type: "boolean", name: "imageWithBaseUrl", label: "Image with base URL", ui: { component: null } },
      ],
    },
  ],
};

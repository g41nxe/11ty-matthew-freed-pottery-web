import type { Collection } from "tinacms";
import { glazesHint } from "../fields/common";

// name "collections_page": "collections" is reserved in Tina's GraphQL.
export const collectionsPage: Collection = {
  name: "collections_page",
  label: "Collections · Page",
  path: "src/views",
  format: "md",
  match: { include: "collections" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    {
      type: "object", name: "intro", label: "Intro",
      fields: [
        { type: "string", name: "eyebrow", label: "Eyebrow" },
        { type: "string", name: "title", label: "Title", description: glazesHint },
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
      ],
    },
    { type: "string", name: "item_cta", label: "Link text on each collection card" },
    { type: "string", name: "filters", label: "Filter chips", list: true },
  ],
};

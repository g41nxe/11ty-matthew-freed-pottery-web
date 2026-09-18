import type { Collection } from "tinacms";
import { imageField } from "../fields/common";

export const retailStoresPage: Collection = {
  name: "retail_stores_page",
  label: "Retail stores · Page",
  path: "src/views",
  format: "md",
  match: { include: "retail-stores" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "eyebrow", label: "Eyebrow" },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
    imageField("banner", "Banner image"),
    {
      type: "object", name: "stores", label: "Stores", list: true,
      ui: { itemProps: (item) => ({ label: [item?.name, item?.city].filter(Boolean).join(" · ") || "New store" }) },
      fields: [
        { type: "string", name: "name", label: "Name" },
        { type: "string", name: "url", label: "Website URL" },
        { type: "string", name: "address", label: "Street address" },
        { type: "string", name: "city", label: "City" },
      ],
    },
    { type: "rich-text", name: "body", label: "Text below the stores", isBody: true },
  ],
};

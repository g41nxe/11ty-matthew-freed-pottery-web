import type { Collection } from "tinacms";
import { imageField } from "../fields/common";

const hexColour = (value: string) =>
  value && !/^#[0-9A-Fa-f]{6}$/.test(value) ? "Use a hex colour like #1F3A52" : undefined;

export const collectionsGallery: Collection = {
  name: "collections_gallery",
  label: "Collections · Glaze gallery",
  path: "src/views/_data",
  format: "json",
  match: { include: "gallery" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    {
      type: "object", name: "items", label: "Glaze lines", list: true,
      description: "Shown on the collections page and in the home page teaser, in this order",
      ui: { itemProps: (item) => ({ label: item?.title || "New glaze line" }) },
      fields: [
        imageField("image", "Image"),
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
        { type: "string", name: "slug", label: "Shop collection slug (tail of the shop URL)" },
        { type: "string", name: "swatch", label: "Swatch colour (hex)", ui: { validate: hexColour } },
        { type: "string", name: "filterGroups", label: "Filter groups", list: true, options: ["Blues", "Charcoals", "Patterned"] },
      ],
    },
  ],
};

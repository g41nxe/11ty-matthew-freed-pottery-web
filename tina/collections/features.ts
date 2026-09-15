import type { Collection } from "tinacms";
import { imageField } from "../fields/common";

export const features: Collection = {
  name: "features",
  label: "Featured shop items",
  path: "src/views/_data",
  format: "json",
  match: { include: "features" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    {
      type: "object", name: "items", label: "Items", list: true,
      description: "The grid next to the featured piece on the home page, in this order",
      ui: { itemProps: (item) => ({ label: item?.title || "New item" }) },
      fields: [
        { type: "string", name: "title", label: "Title", description: "“Glaze - Piece”, for example “Tofino - Belly Mug”" },
        { type: "object", name: "overlay", label: "Overlay", fields: [{ type: "string", name: "text", label: "Text", ui: { component: "textarea" } }] },
        { type: "string", name: "price", label: "Price" },
        imageField("image", "Image"),
        { type: "boolean", name: "hide", label: "Hide" },
        { type: "object", name: "cta", label: "Shop link", fields: [{ type: "string", name: "url", label: "URL" }] },
      ],
    },
  ],
};

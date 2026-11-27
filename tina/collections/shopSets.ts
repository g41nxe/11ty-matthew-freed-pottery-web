import type { Collection } from "tinacms";
import { imageField, linkField } from "../fields/common";

// The pieces Matthew is currently showing, grouped by glaze. They feed two
// places at once — the rotating block on the home page and the shop grid on
// the glaze page of the same name — which is why they are a collection of
// their own and no longer part of "Home · Page". Anyone looking for the
// pieces of a glaze used to end up in the wrong place.
export const shopSets: Collection = {
  name: "shop_sets",
  label: "Shop sets",
  path: "src/views/_data",
  format: "json",
  match: { include: "shop_sets" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    {
      type: "object", name: "sets", label: "Sets", list: true,
      description: "The home page shows one of these at random on every visit, and the glaze page of the same name shows the same pieces. Each set is a featured piece and up to four shop items.",
      ui: {
        itemProps: (set) => ({ label: `${set?.name || "New set"}${set?.hide ? " (hidden)" : ""}` }),
        defaultItem: { hide: false },
      },
      fields: [
        { type: "string", name: "name", label: "Name", required: true, description: "Names this set in the website's statistics and in the shop reports, so renaming starts a new row there. The sets feed the home page only; a glaze page takes its pieces straight from the shop." },
        { type: "boolean", name: "hide", label: "Hide these pieces", description: "Takes the set out of the rotation on the home page and off the glaze page of the same name. The glaze page itself stays, it just shows no pieces." },
        {
          type: "object", name: "featured_piece", label: "Featured piece",
          description: "The large piece on the left, on the home page and on the glaze page.",
          fields: [
            { type: "string", name: "eyebrow", label: "Small label above the title", description: "Stands over the title on the home page and on the glaze page." },
            { type: "string", name: "title", label: "Title" },
            { type: "string", name: "caption", label: "Glaze caption", description: "Home page only." },
            { type: "string", name: "text", label: "Text", ui: { component: "textarea" }, description: "Home page only: the glaze page carries its own description above." },
            {
              type: "object", name: "overlay", label: "Overlay",
              description: "One line about the piece itself, shown under the title on the glaze page. The text above describes the glaze and stays on the home page.",
              fields: [{ type: "string", name: "text", label: "Text", ui: { component: "textarea" } }],
            },
            { type: "string", name: "price", label: "Price" },
            imageField("image", "Image"),
            linkField("cta", "Shop link"),
          ],
        },
        {
          type: "object", name: "items", label: "Shop items", list: true,
          description: "Up to four, shown in this order next to the featured piece. Sold-out items get a label automatically.",
          ui: { max: 4, itemProps: (item) => ({ label: item?.title || "New item" }) },
          fields: [
            { type: "string", name: "title", label: "Title", description: "“Glaze - Piece”, for example “Tofino - Belly Mug”" },
            { type: "object", name: "overlay", label: "Overlay", fields: [{ type: "string", name: "text", label: "Text", ui: { component: "textarea" } }] },
            { type: "string", name: "price", label: "Price" },
            imageField("image", "Image"),
            { type: "object", name: "cta", label: "Shop link", fields: [{ type: "string", name: "url", label: "URL" }] },
          ],
        },
      ],
    },
  ],
};

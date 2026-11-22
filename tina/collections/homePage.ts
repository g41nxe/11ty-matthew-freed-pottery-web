import type { Collection } from "tinacms";
import { glazesHint, imageField, linkField } from "../fields/common";

export const homePage: Collection = {
  name: "home_page",
  label: "Home · Page",
  path: "src/views",
  format: "md",
  match: { include: "home" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    {
      type: "object", name: "hero", label: "Hero",
      fields: [
        { type: "string", name: "eyebrow", label: "Eyebrow" },
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "highlight", label: "Highlight word (shown in sand)", description: "Must appear in the title" },
        { type: "string", name: "text", label: "Text", description: glazesHint, ui: { component: "textarea" } },
        { type: "string", name: "cta_primary", label: "Primary button" },
        linkField("cta_secondary", "Secondary link"),
        imageField("image", "Image"),
      ],
    },
    {
      type: "string", name: "trust", label: "Trust ribbon (below the hero)", list: true,
      description: "Short claims in the ribbon under the hero. It scrolls on phones, spreads across on desktop and shows in uppercase.",
    },
    {
      type: "object", name: "shop_sets", label: "Shop sets", list: true,
      description: "Two places use these: the home page shows one set at random on every visit, and the glaze page of the same name shows the same pieces. Each set is a featured piece and up to four shop items.",
      ui: {
        itemProps: (set) => ({ label: `${set?.name || "New set"}${set?.hide ? " (hidden)" : ""}` }),
        defaultItem: { hide: false },
      },
      fields: [
        { type: "string", name: "name", label: "Name", required: true, description: "Names this set on the website's statistics and in the shop reports, and it is how the glaze page of the same name finds these pieces. Keep it short and unique; renaming it starts a new row in the reports and leaves that glaze page without pieces." },
        { type: "boolean", name: "hide", label: "Hide these pieces", description: "Takes the set out of the rotation on the home page and off the glaze page of the same name. The glaze page itself stays, it just shows no pieces." },
        {
          type: "object", name: "featured_piece", label: "Featured piece",
          fields: [
            { type: "string", name: "eyebrow", label: "Small label above the title" },
            { type: "string", name: "title", label: "Title" },
            { type: "string", name: "caption", label: "Glaze caption" },
            { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
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
    {
      type: "object", name: "collections_teaser", label: "Collections teaser",
      fields: [
        { type: "string", name: "title", label: "Title", description: glazesHint },
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
        { type: "string", name: "item_cta", label: "Link text on each glaze card" },
        { type: "string", name: "link_label", label: "Field-guide link (wide screens)", description: glazesHint },
        { type: "string", name: "link_label_short", label: "Field-guide link (phones)", description: glazesHint },
      ],
    },
    {
      type: "object", name: "products", label: "Products section",
      fields: [
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "note", label: "Note under the grid" },
        { type: "string", name: "link_label", label: "Shop-all link text" },
      ],
    },
    {
      type: "object", name: "events_band", label: "Events band",
      fields: [
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "link_label", label: "All-events link text" },
        { type: "string", name: "no_events", label: "Text when no events", ui: { component: "textarea" } },
      ],
    },
    {
      type: "object", name: "story_teaser", label: "Story teaser",
      fields: [
        { type: "string", name: "eyebrow", label: "Eyebrow" },
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
        { type: "string", name: "quote", label: "Quote" },
        { type: "string", name: "label", label: "Link label" },
        imageField("image", "Image"),
      ],
    },
  ],
};

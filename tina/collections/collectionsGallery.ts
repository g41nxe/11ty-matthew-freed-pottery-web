import type { Collection } from "tinacms";
import { imageField } from "../fields/common";

const hexColour = (value: string) =>
  value && !/^#[0-9A-Fa-f]{6}$/.test(value) ? "Use a hex colour like #1F3A52" : undefined;

// Der Slug ist zugleich das Tag am Produkt, nur in der Schreibweise, in der
// Shopify daraus eine Adresse baut: klein, Leerzeichen als Bindestrich. Ein
// "Squamish Nights" in diesem Feld trifft kein einziges Produkt und führt auf
// eine Sammlung, die es nicht gibt -- genau das ist ein Jahr lang passiert.
const shopSlug = (value: string) =>
  value && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
    ? 'Write it the way the shop writes it in its address: all lowercase, spaces as hyphens, as in "squamish-nights".'
    : undefined;

// The lead carries the top of the glaze page and the snippet Google shows.
// One sentence reads like a caption there, so two are asked for. The page is
// only built when the story is filled in as well (see _data/glazePages.js).
const leadLength = (value: string) =>
  value && value.trim().length < 80
    ? "Write about two sentences here — this is the opening of the glaze page and the text Google shows."
    : undefined;

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
      description: "Shown on the collections page and in the home page teaser, in this order. Fill in both the intro and the page text and the glaze also gets a page of its own. Two things on that page are not edited here: its pieces come from the set of the same name under “Shop sets”, and the wording around them from “Collections · Glaze page”.",
      ui: { itemProps: (item) => ({ label: item?.title || "New glaze line" }) },
      fields: [
        imageField("image", "Image"),
        { type: "string", name: "title", label: "Title" },
        {
          type: "string", name: "text", label: "Card text (one line)",
          description: "The single line under the name on the cards and in the home page slider.",
          ui: { component: "textarea" },
        },
        {
          type: "string", name: "lead", label: "Page intro (two sentences)",
          description: "Opens the glaze page and is the text Google shows in search results. Needs the page text below as well, otherwise no page is built.",
          ui: { component: "textarea", validate: leadLength },
        },
        {
          type: "string", name: "story", label: "Page text",
          description: "The rest of the glaze page, directly under the intro. Leave a blank line between paragraphs. Without this no page is built and the card keeps linking to the shop.",
          ui: { component: "textarea" },
        },
        imageField(
          "feature_image",
          "Group photo for the glaze page",
          "The large picture beside the pieces: several pieces of this glaze together, no single product. Without one the page shows the card image above, which works but repeats itself."
        ),
        {
          type: "string", name: "slug", label: "Shop tag, spelled the way the shop URL spells it", required: true,
          description:
            "This one value does two jobs: the glaze page links to the shop with it, and the pieces it shows are the products carrying this tag in Shopify. " +
            "Write it as the shop writes it in its address - all lowercase, spaces as hyphens: the tag \"Squamish Nights\" is \"squamish-nights\" here. " +
            "Easiest way: open the glaze in your shop and copy the last part of the address. A wrong value leaves the page without pieces and the link on a page that does not exist.",
          ui: { validate: shopSlug },
        },
        {
          type: "string", name: "exclude", label: "Never these pieces (shop links)", list: true,
          description:
            "Normally leave this empty: the page shows what carries the tag above, available pieces first. Fill it in only to keep single pieces off this page while everything else under the tag stays. " +
            "Pemberton Earth uses it for the three blue Sky bowls, which carry the same tag. Paste the shop address of each piece.",
        },
        { type: "string", name: "swatch", label: "Swatch colour (hex)", ui: { validate: hexColour } },
        { type: "string", name: "filterGroups", label: "Filter groups", list: true, options: ["Blues", "Charcoals", "Patterned"] },
      ],
    },
  ],
};

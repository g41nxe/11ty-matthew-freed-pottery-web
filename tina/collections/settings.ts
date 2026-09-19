import type { Collection } from "tinacms";

export const settings: Collection = {
  name: "settings",
  label: "Settings",
  path: "src/views/_data",
  format: "json",
  match: { include: "global" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    {
      type: "object", name: "social", label: "Follow band (bottom of every page)",
      fields: [
        { type: "string", name: "title", label: "Heading" },
        { type: "string", name: "text", label: "Text under the heading" },
        { type: "string", name: "instagram_label", label: "Instagram button text" },
        { type: "string", name: "facebook_label", label: "Facebook button text" },
      ],
    },
    {
      type: "object", name: "contact", label: "Contact information",
      fields: [
        {
          type: "string", name: "address", label: "Address",
          description: "After a move, please let Dan know: the map picture on the contact page is made by hand and stays hidden until it is renewed.",
          ui: { component: "textarea" },
        },
        { type: "string", name: "phone", label: "Phone" },
        { type: "string", name: "email", label: "Email" },
        { type: "string", name: "text", label: "Text in the footer", ui: { component: "textarea" } },
      ],
    },
    {
      type: "object", name: "shop", label: "Shop",
      fields: [
        { type: "string", name: "base", label: "Base URL (no trailing slash)" },
        { type: "string", name: "collectionsPath", label: "Collections path" },
      ],
    },
    {
      type: "object", name: "labels", label: "Shared labels (used on more than one page)",
      fields: [
        { type: "string", name: "at_studio", label: "Studio-event badge" },
        { type: "string", name: "directions", label: "Map link text" },
        { type: "string", name: "next_market", label: "Home page, label in front of the next market" },
        { type: "string", name: "next_up", label: "Badge on the next event card" },
        { type: "string", name: "dates_soon", label: "Shown when every listed date has passed" },
        { type: "string", name: "keep_reading", label: "Heading above the links at the end of the About pages" },
        { type: "string", name: "sold_out", label: "Label on sold-out shop items (set automatically from the shop)" },
      ],
    },
    {
      type: "object", name: "footer", label: "Footer links (text only)",
      fields: [
        { type: "string", name: "retail", label: "Retail stores" },
        { type: "string", name: "faq", label: "FAQ" },
        { type: "string", name: "art", label: "Art" },
        { type: "string", name: "process", label: "Process" },
        { type: "string", name: "privacy", label: "Privacy" },
      ],
    },
    {
      type: "object", name: "seo", label: "Search engines and sharing",
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
    },
    {
      type: "object", name: "socialmedia", label: "Social media links",
      fields: [
        {
          type: "object", name: "services", label: "Profiles",
          fields: [
            { type: "object", name: "instagram", label: "Instagram", fields: [{ type: "string", name: "url", label: "Profile URL" }] },
            { type: "object", name: "facebook", label: "Facebook", fields: [{ type: "string", name: "url", label: "Profile URL" }] },
          ],
        },
      ],
    },
  ],
};

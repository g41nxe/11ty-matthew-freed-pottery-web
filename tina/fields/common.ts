import type { TinaField } from "tinacms";

// An image the site renders through the {% img %} shortcode: the path
// Tina stores (/images/…) plus the alt text.
export const imageField = (name: string, label: string): TinaField => ({
  type: "object",
  name,
  label,
  fields: [
    { type: "image", name: "url", label: "Image" },
    { type: "string", name: "alt", label: "Alt text", description: "Describes the image for people who cannot see it" },
  ],
});

export const linkField = (name: string, label: string): TinaField => ({
  type: "object",
  name,
  label,
  fields: [
    { type: "string", name: "label", label: "Label" },
    { type: "string", name: "url", label: "URL" },
  ],
});

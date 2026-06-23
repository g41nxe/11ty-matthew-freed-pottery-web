# Matthew Freed Pottery — Website

Static site for [matthewfreed.ca](https://matthewfreed.ca), built with
[Eleventy](https://www.11ty.io/) + [Tailwind CSS](https://tailwindcss.com/),
hosted on [Netlify](https://docs.netlify.com/), with content managed by
[Sveltia CMS](https://sveltiacms.app/) (the successor to Decap/Netlify CMS).

## Commands

```bash
npm run dev      # build + watch + serve at http://localhost:8080/
npm run cms      # same dev server, for editing content locally (see below)
npm run build    # production build into dist/
npm run clean    # remove dist/
```

## Editing content

The CMS lives at `/admin` and is configured in [`src/admin/config.yml`](src/admin/config.yml).

### In production
Go to **https://matthewfreed.ca/admin** and **log in with GitHub**. Authentication
is handled by Netlify's OAuth provider (a GitHub OAuth app registered in the Netlify
dashboard). Editors need **write access** to the `g41nxe/11ty-matthew-freed-pottery-web`
repository; saving an entry commits directly to the production branch.

### Locally
Run `npm run cms`, open **http://localhost:8080/admin**, and choose
**"Work with Local Repository"**. Sveltia edits the files on disk directly via the
browser's File System Access API — **a Chromium-based browser is required** (Chrome,
Edge, etc.; not Firefox/Safari), and no proxy server is needed.

## Notes

- **Images** are cropped to fixed aspect ratios at build time (in the `{% img %}`
  shortcode in [`.eleventy.js`](.eleventy.js)) using `sharp`. Each managed image has a
  **Crop Focus** field (default *Auto*) so editors can pick which region is kept.
  Uploads are auto-converted to WebP and capped at 2048px.
- **Dates** are stored as `MM-DD-YYYY`; the CMS date fields are date-only.
- The Sveltia `backend.branch` in `config.yml` must point at the branch Netlify
  deploys to production.

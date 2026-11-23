# Browser tools

This directory is a standalone set of tools on GitHub Pages, separate from the portfolio's app and game listings.

## Routes

- `/tools/` – localized tool catalog.
- `/tools/merge-pdf/` – localized client-side PDF editing workspace (the directory also resolves from `/tools/merge-pdf` on GitHub Pages).

The homepage (`/index.html`) links to the catalog and the editor below the app listings. All pages use the site's ten language codes: `en`, `vi`, `ja`, `ko`, `zh_CN`, `zh_TW`, `fr`, `de`, `th`, and `km`. Select a locale through `?lang=vi` (also supported on the homepage).

## PDF editor behavior

- Upload multiple PDF files or drag and drop them.
- Preview page thumbnails; select/deselect individual pages.
- Reorder pages, remove pages, rotate pages 90 degrees, or apply percentage crop margins to selected pages.
- Download a single PDF with **all** remaining pages in the chosen order, or just the selected pages (extract/split).
- Optionally stamp sequential numeric page numbers in the exported document.
- Select and edit only page-level content. **Existing text and PDF objects are not editable** with this tool.
- Crop uses the PDF CropBox (view-only), **not secure redaction**: hidden data remains recoverable in the exported PDF.
- Encrypted/damaged PDFs are not supported. Limits: 100 MB per file, 300 pages per editing session.

PDF bytes are read and processed in the browser using [pdf-lib](https://pdf-lib.js.org/) (MIT) and [Mozilla PDF.js](https://mozilla.github.io/pdf.js/) (Apache-2.0). No file upload endpoints or backend are used. The JavaScript libraries and PDF.js worker load from version-pinned third-party CDNs; an internet connection is therefore needed to use the app. PDF.js uses `isEvalSupported: false` when opening untrusted files.

## Manual verification

Run a static HTTP server in the repository root, such as `python3 -m http.server 8000`, and verify:

1. Open `http://localhost:8000/?lang=vi`, `/tools/?lang=vi` and `/tools/merge-pdf/?lang=vi`. Confirm translations and navigation.
2. Test all ten locale selectors and keyboard access.
3. Load two normal PDFs and inspect their preview thumbnails.
4. Move a page up/down, rotate it, select two pages, and download selected pages; confirm the order and page count in the output.
5. Apply e.g. 5% left + 5% right crop, export, and confirm visible page edges (this **does not** remove hidden PDF data).
6. Enable page numbers and export all pages; inspect the generated document.
7. Try a corrupt/encrypted PDF, a non-PDF file, a file over 100 MB, and an invalid crop (e.g. 60% left + 60% right); confirm errors.
8. Check mobile layout and that network requests do not contain the local PDF bytes.

There is no build step; `index.html`, `tools/index.html` and `tools/merge-pdf/index.html` are served directly by GitHub Pages.

## Shared website design system

The site uses the same visual system as the PDF editor across **all public GitHub Pages HTML routes**:

- Root homepage `/`.
- Lofi Garden landing page and privacy policy.
- MomWell landing page, privacy policy, and account-deletion page.
- Tools directory and PDF editor (already using the base styles).

**Bootstrap 5.3.9** is loaded directly from the official jsDelivr CDN on all eight HTML routes, using version-pinned CSS + the JavaScript bundle with official Subresource Integrity (SRI) hashes. The design deliberately uses native Bootstrap components and utilities instead of an overriding theme: `container`, `row`, `col-*`, `navbar`, `card`, `btn-dark`, `btn-outline-dark`, `form-*`, `alert`, and the default neutral `bg-body-tertiary` palette. There is **no custom Bootstrap theme stylesheet**. `tools/assets/site-layout.css` only handles initial locale visibility and sizes of game media; `tools/assets/styles.css` only handles PDF thumbnails/drag-and-drop and the dark checkbox accent. The product pages retain their translated text, screenshots, store badges, policies, and behavior. The first English article is active in the source HTML to prevent flashes of all translations before JavaScript initializes.

`site-shell.js` connects the shared header language picker to the existing translation controls without rewriting policy/document scripts. Original language buttons remain present (but visually hidden); switching languages still uses the original page selector. Header links preserve the locale through `?lang=`.

### Visual regression checklist

1. Check layout at 375px and 1280px widths: header, language selector, cards, screenshots, and policy text.
2. Verify locale switches at `/`, `/lofi-garden/`, `/lofi-garden/policy.html`, `/mom-well/`, `/mom-well/policy.html`, and `/mom-well/delete-account.html`.
3. Verify privacy-policy and account-deletion anchor links still navigate to the corresponding locale.
4. Confirm app store badge images, screenshot carousels, and PDF editor interactions still work.
5. Confirm `/tools/` and `/tools/merge-pdf/` render with Bootstrap components and neutral dark action buttons. Ensure PDF drag/drop, selection, rotation, crop, and export still work.


The Bootstrap CDN links and SRI hashes follow [Bootstrap's official 5.3.9 documentation](https://getbootstrap.com/docs/5.3/getting-started/introduction/). Use one version across all pages when upgrading.

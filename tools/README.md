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

## Strict Bootstrap-only website design

All eight public HTML pages load **Bootstrap 5.3.9 CSS and JS bundle from jsDelivr CDN**, with SRI values copied from [the official Bootstrap documentation](https://getbootstrap.com/docs/5.3/getting-started/introduction/). No local stylesheet files, `<style>` blocks, inline `style` attributes, custom CSS selectors, or custom theme overrides are used.

- Components and presentation use only Bootstrap-provided classes: `container`, `row`, `col`, `navbar`, `card`, `btn-dark`, `form-control`, `form-select`, `alert`, `d-none`, spacing and color utilities.
- Use `rounded-0` on cards, buttons, alerts, forms and images to prevent rounded corners, including elements generated dynamically by JavaScript.
- The homepage lists apps and games separately from browser tools.
- Lofi Garden uses responsive Bootstrap columns for the app description and screenshots.
- Language tabs are switched by JavaScript toggling Bootstrap's `d-none` class; the language selector is wired through IDs and `data-*` attributes, not CSS selectors unique to the project. Initial HTML hides all non-English language articles until a selected language is applied.
- The PDF editor builds its dynamic page cards via Bootstrap grid/utility classes; drag/drop and selection states toggle Bootstrap-provided border/background classes. Canvas pixel dimensions are set through canvas attributes without custom CSS styling.
- No change to translated text, privacy policies, local PDF processing or download behavior is intended.

### Manual regression checklist

1. Check each page at 375px and 1280px: all buttons, cards, inputs and images have **square corners**.
2. Verify all supported language selectors and URL `?lang=` and `#lang` links. The homepage and Lofi Garden support 10 locales; MomWell supports 6.
3. Confirm the app screenshots, icon, store badges and privacy/account-deletion links.
4. On `/tools/merge-pdf/`, test drag-and-drop, multiple files, page selection, rearranging, rotation, cropping and download.
5. Inspect network requests for stylesheet files: the **only CSS request** should be the version-pinned Bootstrap CDN.
6. Check both regular and high-DPI screens for PDF preview canvas sizing.

There is no build step; GitHub Pages serves all HTML, JavaScript and images directly.

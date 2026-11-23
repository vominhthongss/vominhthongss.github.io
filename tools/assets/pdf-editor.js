/* PDF operations are entirely client-side. pdf-lib edits bytes; PDF.js previews pages. */
(function () {
  "use strict";
  const MAX_FILE_BYTES = 100 * 1024 * 1024;
  const MAX_PAGES = 300;
  const WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
  const $ = id => document.getElementById(id);
  const t = (key, vars) => window.ToolsI18n.t(key, vars);
  const state = {
    sources: [], pages: [], busy: false, sequence: 0,
    notice: { key: "noPages", vars: {}, type: "" },
    observer: null
  };

  if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER;

  function notice(key, type = "", vars = {}) {
    state.notice = { key, vars, type };
    const element = $("status");
    element.textContent = t(key, vars);
    element.className = "alert mt-3 mb-0 rounded-0 " + (type === "error" ? "alert-danger" : type === "success" ? "alert-success" : "alert-secondary");
  }

  function selectedPages() { return state.pages.filter(page => page.selected); }

  function setBusy(busy) {
    state.busy = busy;
    document.querySelector("main").setAttribute("aria-busy", String(busy));
    $("filePicker").disabled = busy;
    updateControls();
  }

  function updateControls() {
    const total = state.pages.length;
    const selected = selectedPages().length;
    $("pageCount").textContent = t("pagesCount", { count: total, selected });
    const needPages = ["selectAll", "deselectAll", "downloadAll", "reset"];
    for (const id of needPages) $(id).disabled = state.busy || total === 0;
    const needSelection = ["rotateLeft", "rotateRight", "removeSelected", "applyCrop", "downloadSelected"];
    for (const id of needSelection) $(id).disabled = state.busy || selected === 0;
    $("chooseBtn").disabled = state.busy;
    for (const button of $("pages").querySelectorAll("button")) button.disabled = state.busy || button.dataset.edge === "true";
    for (const checkbox of $("pages").querySelectorAll("input[type=checkbox]")) checkbox.disabled = state.busy;
  }

  function createButton(action, label, index, edge = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-sm rounded-0 " + (action === "remove" ? "btn-outline-danger" : "btn-outline-secondary");
    button.dataset.action = action;
    button.dataset.index = String(index);
    if (edge) button.dataset.edge = "true";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.textContent = label;
    return button;
  }

  function renderPages() {
    const host = $("pages");
    if (state.observer) state.observer.disconnect();
    host.replaceChildren();
    if (!state.pages.length) {
      const empty = document.createElement("p");
      empty.className = "text-secondary";
      empty.textContent = t("noPages");
      host.append(empty);
      updateControls();
      return;
    }
    const fragment = document.createDocumentFragment();
    state.pages.forEach((record, index) => {
      const source = state.sources[record.source];
      const card = document.createElement("div");
      card.className = "card border p-2 h-100 rounded-0 d-flex flex-column" + (record.selected ? " border-dark bg-body-tertiary" : " border-secondary-subtle");
      card.dataset.pdfPageCard = "true";
      const preview = document.createElement("div");
      preview.className = "bg-body-secondary border d-flex align-items-center justify-content-center p-2";
      const canvas = document.createElement("canvas");
      canvas.className = "img-fluid d-block mx-auto";
      canvas.dataset.pageId = String(record.id);
      preview.append(canvas);
      card.append(preview);
      const title = document.createElement("p");
      title.className = "small fw-semibold text-break mt-2 mb-1";
      title.textContent = source.name + " · " + t("page") + " " + record.pageNumber;
      card.append(title);
      const choose = document.createElement("label");
      choose.className = "form-check d-flex gap-2 align-items-center mt-2";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "form-check-input mt-0 rounded-0";
      checkbox.checked = record.selected;
      checkbox.dataset.pageId = String(record.id);
      const label = document.createElement("span");
      label.textContent = t("selected");
      choose.append(checkbox, label);
      card.append(choose);
      if (record.rotation || Object.values(record.crop).some(value => value > 0)) {
        const note = document.createElement("div");
        note.className = "small text-secondary";
        const crop = Object.values(record.crop).some(value => value > 0) ? " · crop" : "";
        note.textContent = (record.rotation ? record.rotation + "°" : "") + crop;
        card.append(note);
      }
      const actions = document.createElement("div");
      actions.className = "d-flex flex-wrap gap-1 mt-auto pt-2";
      actions.append(
        createButton("up", "↑ " + t("up"), index, index === 0),
        createButton("down", "↓ " + t("down"), index, index === state.pages.length - 1),
        createButton("left", "↶", index),
        createButton("right", "↷", index),
        createButton("remove", "× " + t("remove"), index)
      );
      actions.children[2].setAttribute("aria-label", t("rotateLeft"));
      actions.children[3].setAttribute("aria-label", t("rotateRight"));
      card.append(actions);
      const column = document.createElement("div");
      column.className = "col";
      column.append(card);
      fragment.append(column);
    });
    host.append(fragment);
    if ("IntersectionObserver" in window) {
      state.observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          state.observer.unobserve(entry.target);
          void previewPage(entry.target);
        }
      }, { rootMargin: "150px" });
      for (const canvas of host.querySelectorAll("canvas")) state.observer.observe(canvas);
    } else {
      for (const canvas of host.querySelectorAll("canvas")) void previewPage(canvas);
    }
    updateControls();
  }

  async function previewPage(canvas) {
    const record = state.pages.find(page => String(page.id) === canvas.dataset.pageId);
    if (!record || !canvas.isConnected) return;
    try {
      const page = await state.sources[record.source].preview.getPage(record.pageNumber);
      if (!canvas.isConnected) return;
      const rotation = ((page.rotate + record.rotation) % 360 + 360) % 360;
      const original = page.getViewport({ scale: 1, rotation });
      const scale = Math.min(145 / original.width, 171 / original.height, 1);
      const viewport = page.getViewport({ scale, rotation });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(viewport.width * ratio);
      canvas.height = Math.ceil(viewport.height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      const transform = ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0];
      await page.render({ canvasContext: context, viewport, transform }).promise;
    } catch (error) {
      console.warn("PDF preview failed:", error);
    }
  }

  async function addFiles(files) {
    if (state.busy) return;
    if (!window.PDFLib || !window.pdfjsLib) {
      notice("libError", "error");
      return;
    }
    if (!files.length) return;
    setBusy(true);
    notice("loading");
    let added = 0;
    try {
      for (const file of files) {
        if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
          notice("fileError", "error", { name: file.name });
          continue;
        }
        if (file.size > MAX_FILE_BYTES || file.size === 0) {
          notice("limit", "error");
          continue;
        }
        try {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const pdf = await window.pdfjsLib.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
          if (state.pages.length + pdf.numPages > MAX_PAGES) {
            await pdf.destroy();
            notice("limit", "error");
            continue;
          }
          const source = state.sources.length;
          state.sources.push({ name: file.name, bytes, preview: pdf });
          for (let index = 1; index <= pdf.numPages; index++) {
            state.pages.push({
              id: ++state.sequence, source, pageNumber: index,
              selected: true, rotation: 0, crop: { left: 0, right: 0, top: 0, bottom: 0 }
            });
            added++;
          }
        } catch (error) {
          console.warn("PDF load failed:", error);
          notice("fileError", "error", { name: file.name });
        }
      }
      renderPages();
      if (added) notice("pagesCount", "success", { count: state.pages.length, selected: selectedPages().length });
    } finally {
      setBusy(false);
    }
  }

  function setSelection(selected) {
    for (const record of state.pages) record.selected = selected;
    for (const box of $("pages").querySelectorAll("input[data-page-id]")) {
      box.checked = selected;
      const card = box.closest("[data-pdf-page-card]");
      if (card) {
        card.classList.toggle("border-dark", selected);
        card.classList.toggle("border-secondary-subtle", !selected);
        card.classList.toggle("bg-body-tertiary", selected);
      }
    }
    updateControls();
  }

  function rotateSelected(angle) {
    for (const page of selectedPages()) page.rotation = (page.rotation + angle + 360) % 360;
    renderPages();
  }

  function removeSelected() {
    if (!selectedPages().length) return;
    if (!window.confirm(t("removeSelected") + "?")) return;
    state.pages = state.pages.filter(page => !page.selected);
    renderPages();
  }

  function cropSelected() {
    if (!selectedPages().length) {
      notice("nothingSelected", "error");
      return;
    }
    const edges = ["left", "right", "top", "bottom"];
    const crop = {};
    for (const edge of edges) crop[edge] = Number($("crop" + edge[0].toUpperCase() + edge.slice(1)).value);
    if (edges.some(edge => !Number.isFinite(crop[edge]) || crop[edge] < 0 || crop[edge] >= 100) ||
        crop.left + crop.right >= 100 || crop.top + crop.bottom >= 100) {
      notice("invalidCrop", "error");
      return;
    }
    for (const page of selectedPages()) page.crop = { ...crop };
    renderPages();
    notice("pagesCount", "success", { count: state.pages.length, selected: selectedPages().length });
  }

  async function download(selectedOnly) {
    if (state.busy) return;
    const pages = selectedOnly ? selectedPages() : state.pages.slice();
    if (!pages.length) {
      notice("nothingSelected", "error");
      return;
    }
    if (!window.PDFLib) {
      notice("libError", "error");
      return;
    }
    setBusy(true);
    notice("working");
    try {
      const { PDFDocument, degrees, StandardFonts, rgb } = window.PDFLib;
      const result = await PDFDocument.create();
      const sourceDocuments = new Map();
      const needsNumbers = $("numberPages").checked;
      const font = needsNumbers ? await result.embedFont(StandardFonts.Helvetica) : null;
      for (const record of pages) {
        if (!sourceDocuments.has(record.source)) {
          const source = state.sources[record.source];
          const document = await PDFDocument.load(source.bytes.slice());
          sourceDocuments.set(record.source, document);
        }
        const sourceDocument = sourceDocuments.get(record.source);
        const [page] = await result.copyPages(sourceDocument, [record.pageNumber - 1]);
        const originalRotation = page.getRotation().angle || 0;
        page.setRotation(degrees(((originalRotation + record.rotation) % 360 + 360) % 360));
        const c = record.crop;
        if (Object.values(c).some(value => value > 0)) {
          const box = page.getCropBox();
          const x = box.x + box.width * c.left / 100;
          const y = box.y + box.height * c.bottom / 100;
          const width = box.width * (1 - (c.left + c.right) / 100);
          const height = box.height * (1 - (c.top + c.bottom) / 100);
          page.setCropBox(x, y, width, height);
        }
        if (font) {
          const number = String(result.getPageCount() + 1);
          const visible = page.getCropBox();
          const size = 10;
          const width = font.widthOfTextAtSize(number, size);
          page.drawText(number, {
            x: visible.x + (visible.width - width) / 2,
            y: visible.y + 12, font, size, color: rgb(0.25, 0.31, 0.4)
          });
        }
        result.addPage(page);
      }
      const output = await result.save();
      const file = new Blob([output], { type: "application/pdf" });
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = selectedOnly ? "selected-pages.pdf" : "merged-document.pdf";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      notice("done", "success");
    } catch (error) {
      console.error("PDF export failed:", error);
      notice("fileError", "error", { name: "PDF" });
    } finally {
      setBusy(false);
    }
  }

  async function clearAll() {
    if (state.busy) return;
    const old = state.sources;
    state.sources = [];
    state.pages = [];
    renderPages();
    notice("noPages");
    for (const source of old) {
      try { await source.preview.destroy(); } catch (error) { console.warn(error); }
    }
  }

  $("chooseBtn").addEventListener("click", () => $("filePicker").click());
  $("filePicker").addEventListener("change", event => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    void addFiles(files);
  });
  const zone = $("dropzone");
  for (const type of ["dragenter", "dragover"]) zone.addEventListener(type, event => {
    event.preventDefault();
    if (!state.busy) {
      zone.classList.remove("border-secondary", "bg-body-tertiary");
      zone.classList.add("border-dark", "bg-secondary-subtle");
    }
  });
  for (const type of ["dragleave", "drop"]) zone.addEventListener(type, event => {
    event.preventDefault();
    zone.classList.remove("border-dark", "bg-secondary-subtle");
    zone.classList.add("border-secondary", "bg-body-tertiary");
  });
  zone.addEventListener("drop", event => void addFiles(Array.from(event.dataTransfer?.files || [])));
  window.addEventListener("dragover", event => event.preventDefault());
  window.addEventListener("drop", event => {
    if (!zone.contains(event.target)) event.preventDefault();
  });

  $("pages").addEventListener("change", event => {
    const input = event.target.closest("input[data-page-id]");
    if (!input || state.busy) return;
    const record = state.pages.find(page => String(page.id) === input.dataset.pageId);
    if (!record) return;
    record.selected = input.checked;
    const card = input.closest("[data-pdf-page-card]");
    if (card) {
      card.classList.toggle("border-dark", record.selected);
      card.classList.toggle("border-secondary-subtle", !record.selected);
      card.classList.toggle("bg-body-tertiary", record.selected);
    }
    updateControls();
  });
  $("pages").addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button || state.busy || button.disabled) return;
    const index = Number(button.dataset.index);
    if (!Number.isInteger(index) || !state.pages[index]) return;
    switch (button.dataset.action) {
      case "up":
        if (index > 0) [state.pages[index - 1], state.pages[index]] = [state.pages[index], state.pages[index - 1]];
        break;
      case "down":
        if (index < state.pages.length - 1) [state.pages[index + 1], state.pages[index]] = [state.pages[index], state.pages[index + 1]];
        break;
      case "left": state.pages[index].rotation = (state.pages[index].rotation + 270) % 360; break;
      case "right": state.pages[index].rotation = (state.pages[index].rotation + 90) % 360; break;
      case "remove": state.pages.splice(index, 1); break;
      default: return;
    }
    renderPages();
  });
  $("selectAll").addEventListener("click", () => setSelection(true));
  $("deselectAll").addEventListener("click", () => setSelection(false));
  $("rotateLeft").addEventListener("click", () => rotateSelected(270));
  $("rotateRight").addEventListener("click", () => rotateSelected(90));
  $("removeSelected").addEventListener("click", removeSelected);
  $("applyCrop").addEventListener("click", cropSelected);
  $("downloadAll").addEventListener("click", () => void download(false));
  $("downloadSelected").addEventListener("click", () => void download(true));
  $("reset").addEventListener("click", () => void clearAll());
  window.ToolsI18n.onChange(() => {
    renderPages();
    notice(state.notice.key, state.notice.type, state.notice.vars);
  });
  renderPages();
  notice("noPages");
  if (!window.PDFLib || !window.pdfjsLib) notice("libError", "error");
})();

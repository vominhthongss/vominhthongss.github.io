/* The existing multilingual page scripts own article selection.
   This adapter makes the shared header work without rewriting product or policy logic. */
(function () {
  "use strict";
  const picker = document.getElementById("site-language");
  if (!picker) return;

  const labels = {
    en: ["Home", "Tools", "Language"],
    vi: ["Trang chủ", "Công cụ", "Ngôn ngữ"],
    ja: ["ホーム", "ツール", "言語"],
    ko: ["홈", "도구", "언어"],
    zh_CN: ["首页", "工具", "语言"],
    zh_TW: ["首頁", "工具", "語言"],
    fr: ["Accueil", "Outils", "Langue"],
    de: ["Startseite", "Tools", "Sprache"],
    th: ["หน้าแรก", "เครื่องมือ", "ภาษา"],
    km: ["ទំព័រដើម", "ឧបករណ៍", "ភាសា"]
  };
  const buttons = Array.from(document.querySelectorAll("nav[data-legacy-langs] button[data-lang]"));
  const normalize = raw => {
    const value = (raw || "").replace("-", "_");
    if (buttons.some(button => button.dataset.lang === value)) return value;
    const lower = value.toLowerCase();
    if (lower.startsWith("zh")) return /tw|hk|mo|hant/.test(lower) ? "zh_TW" : "zh_CN";
    const base = lower.split(/[-_]/)[0];
    return buttons.some(button => button.dataset.lang === base) ? base : "en";
  };

  function sync() {
    const active = buttons.find(button => button.getAttribute("aria-pressed") === "true");
    const code = active?.dataset.lang || normalize(new URLSearchParams(location.search).get("lang") || location.hash.slice(1));
    const locale = labels[code] || labels.en;
    picker.value = code;
    for (const anchor of document.querySelectorAll("[data-site-link]")) {
      const type = anchor.dataset.siteLink;
      anchor.textContent = type === "home" ? locale[0] : locale[1];
      const url = new URL(anchor.dataset.siteHref, location.href);
      url.searchParams.set("lang", code);
      anchor.href = url.href;
    }
    const languageLabel = document.querySelector('label[for="site-language"]');
    if (languageLabel) languageLabel.textContent = locale[2];
  }

  picker.addEventListener("change", () => {
    const button = buttons.find(el => el.dataset.lang === picker.value);
    if (!button) return;
    // The older article selector may prioritize ?lang over #language on page reload.
    const url = new URL(location.href);
    url.searchParams.delete("lang");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
    button.click();
    sync();
  });
  window.addEventListener("hashchange", sync);
  sync();
})();

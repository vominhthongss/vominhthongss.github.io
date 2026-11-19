(() => {
  "use strict";
  const LANGS = ["en","vi","ja","ko","zh_CN","zh_TW","fr","de","th","km"];
  const HTML_LANG = { zh_CN: "zh-Hans", zh_TW: "zh-Hant" };
  const HOME_LABELS = {"en":"Home","vi":"Trang chủ","ja":"ホーム","ko":"홈","zh_CN":"首页","zh_TW":"首頁","fr":"Accueil","de":"Startseite","th":"หน้าแรก","km":"ទំព័រដើម"};
  const articles = [...document.querySelectorAll("main > article")];
  const buttons = [...document.querySelectorAll("button[data-lang]")];
  const links = [...document.querySelectorAll("a[data-local-link]")];
  function normalize(code) {
    if (!code) return "";
    const c = code.replace("-", "_");
    if (LANGS.includes(c)) return c;
    const low = code.toLowerCase();
    if (low.startsWith("zh")) return /hant|tw|hk|mo/.test(low) ? "zh_TW" : "zh_CN";
    const base = low.split(/[-_]/)[0];
    return LANGS.includes(base) ? base : "";
  }
  function show(id, updateUrl = false) {
    for (const article of articles) article.hidden = article.id !== id;
    for (const button of buttons) button.setAttribute("aria-pressed", String(button.dataset.lang === id));
    document.documentElement.lang = HTML_LANG[id] || id;
    for (const link of links) {
      link.setAttribute("href", link.getAttribute("href").split("#")[0] + "#" + id);
      if (link.hasAttribute("data-home-label")) link.textContent = HOME_LABELS[id];
    }
    if (location.pathname.endsWith("/policy.html")) {
      const heading = document.getElementById(id)?.querySelector("h1");
      if (heading) document.title = heading.textContent;
    }
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.delete("lang");
      url.hash = id;
      history.replaceState(null, "", url);
    }
  }
  for (const button of buttons) button.addEventListener("click", () => {
    show(button.dataset.lang, true);
    window.scrollTo(0, 0);
  });
  window.addEventListener("hashchange", () => {
    const id = normalize(location.hash.slice(1));
    if (id) show(id);
  });
  show(normalize(location.hash.slice(1)) || normalize(new URLSearchParams(location.search).get("lang")) || "en");
})();

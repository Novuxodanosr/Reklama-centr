// Поиск товаров WIWU из прайса (Excel) на официальном сайте wiwu.com (Shopify): фото, описание, варианты цвета.
// Вход: JSON строк прайса [{n, title, ean, qty, cost}] (scripts/catalog/excel-rows.ps1 → json).
// Выход: JSON с найденным товаром для каждой строки (handle, title, images, body, score) — для проверки и импорта.
// Запуск: node scripts/catalog/wiwu-match.mjs <rows.json> <out.json>
import fs from "node:fs";

const [, , inFile, outFile] = process.argv;
const rows = JSON.parse(fs.readFileSync(inFile, "utf8"));
const done = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : {};
const UA = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: UA }).catch(() => null);
    if (r && r.ok) return r.json();
    await sleep(3000 * (i + 1)); // Shopify ограничивает частоту запросов
  }
  return null;
}

const norm = (s) => s.toLowerCase().replace(/[（(]/g, " ").replace(/[）)"”]/g, " ").replace(/wi[\s-]?(?=[a-z]{0,3}\d)/g, "wi-").replace(/\s+/g, " ").trim();
// Код модели: Wi-P085, TD-11, ZM-901, EB307, CH 326, MW 003, T32, O203 …
function codes(title) {
  const t = title.replace(/WIWU/i, "");
  const out = new Set();
  for (const m of t.matchAll(/\b(Wi[\s-]?[A-Z]{1,3}[\s-]?\d{2,4}[A-Z]?|[A-Z]{1,4}[\s-]?\d{2,4}(?:-[A-Z0-9]+)?|[A-Z]\d{2,4})\b/g)) {
    const c = m[1].replace(/\s+/g, "-").toUpperCase();
    if (!/^(IP|S)\d+$/.test(c) && !/^\d/.test(c)) out.add(c);
  }
  return [...out];
}
const words = (s) => norm(s).replace(/[^a-z0-9.\- ]/g, " ").split(" ").filter((w) => w.length > 1 && !["wiwu", "for", "with", "the", "and"].includes(w));

function score(row, p) {
  const a = new Set(words(row.title.replace(/WIWU/i, "")));
  const b = words(p.title + " " + (p.handle || "").replace(/-/g, " "));
  let s = 0;
  for (const w of b) if (a.has(w)) s += /\d/.test(w) ? 3 : 1;
  for (const c of codes(row.title)) if (norm(p.title + " " + p.handle.replace(/-/g, " ")).replace(/-/g, "").includes(c.toLowerCase().replace(/-/g, ""))) s += 6;
  return s;
}

for (const row of rows) {
  if (done[row.n]) continue;
  const q = new Set([...codes(row.title), row.title.replace(/^.*?WIWU\s*/i, "").replace(/\s*\d+\s*mAh/i, "").trim()]);
  let best = null;
  for (const query of q) {
    const j = await get(`https://www.wiwu.com/search/suggest.json?q=${encodeURIComponent(query)}&resources%5Btype%5D=product&resources%5Blimit%5D=10`);
    await sleep(1200);
    for (const p of j?.resources?.results?.products ?? []) {
      const s = score(row, p);
      if (!best || s > best.score) best = { handle: p.handle, title: p.title, score: s, query };
    }
    if (best && best.score >= 9) break;
  }
  if (best) {
    const full = await get(`https://www.wiwu.com/products/${best.handle}.js`);
    await sleep(1200);
    if (full) Object.assign(best, { body: full.description, images: full.images.map((u) => (u.startsWith("//") ? "https:" + u : u)), variants: (full.variants || []).map((v) => ({ title: v.title, image: v.featured_image?.src })), type: full.type });
  }
  done[row.n] = { row, match: best };
  fs.writeFileSync(outFile, JSON.stringify(done, null, 1));
  console.log(row.n, best ? `${best.score} ${best.title}` : "— не найдено", "|", row.title);
}

// Импорт витрины WIWU в data/catalog.json: строки прайса + найденный на wiwu.com товар (wiwu-match.mjs) + тексты RU/EN/UZ.
// Фото скачиваются с официального сайта, ужимаются до 1200 px WebP в public/catalog/.
// Повторный запуск обновляет те же товары (id = wiwu-<штрихкод>), не дублирует.
// Запуск: node scripts/catalog/import-wiwu.mjs <match.json> <texts.json>
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [, , matchFile, textsFile] = process.argv;
const matches = JSON.parse(fs.readFileSync(matchFile, "utf8"));
const texts = JSON.parse(fs.readFileSync(textsFile, "utf8"));
const catalogFile = "data/catalog.json";
const catalog = JSON.parse(fs.readFileSync(catalogFile, "utf8"));
const imgDir = "public/catalog";
const MAX_IMAGES = 6;

// Раздел «Гаджеты и аксессуары» и подразделы по типу товара из прайса.
// Общий раздел с сувенирной продукцией (id «souvenirs» исторический), переименован в «Гаджеты и аксессуары».
const root = { id: "souvenirs", parent: null, title: { ru: "Гаджеты и аксессуары", en: "Gadgets & Accessories", uz: "Gadjetlar va aksessuarlar" } };
const subs = [
  ["gadget-cases", "Чехлы и защитные стёкла", "Cases & Screen Protectors", "G‘iloflar va himoya oynalari", /^(CASE|GLASS)/],
  ["gadget-audio", "Наушники", "Headphones & Earbuds", "Quloqchinlar", /^(HEADPHONE|AIRBUDS|EARPHONE|EARBUDS)/],
  ["gadget-bags", "Сумки и рюкзаки для ноутбуков", "Laptop Bags & Sleeves", "Noutbuk sumkalari", /^(LAPTOP BAG|TABLET BAG|MAN BAG|CROSSBODY)/],
  ["gadget-power-banks", "Повербанки", "Power Banks", "Powerbanklar", /^POWERBANK/],
  ["gadget-charging", "Зарядки, кабели и адаптеры", "Chargers, Cables & Adapters", "Zaryadlovchilar, kabellar va adapterlar", /^(CABLE|CHARGER|HOME ADAPTER|CAR ADAPTER|CONVERTER|HUB|HDM|WIRELESS CHARGER)/i],
  ["gadget-holders", "Подставки и держатели", "Stands & Holders", "Taglik va ushlagichlar", /^(LAPTOP STAND|STAND|HOLDER STAND|CAR HOLDER|SELFIE STICK)/],
  ["gadget-wallets", "Кошельки и картхолдеры", "Wallets & Card Holders", "Hamyonlar va kartochka g‘iloflari", /^(WALLET|CARD WALLET|CARD HOLDER)/],
  ["gadget-other", "Другие аксессуары", "Other Accessories", "Boshqa aksessuarlar", /./],
];
let order = Math.max(0, ...catalog.categories.map((c) => c.order)) + 1;
if (!catalog.categories.some((c) => c.id === root.id)) catalog.categories.push({ ...root, order: order++ });
for (const [id, ru, en, uz] of subs) if (!catalog.categories.some((c) => c.id === id)) catalog.categories.push({ id, parent: root.id, title: { ru, en, uz }, order: order++ });
const catOf = (title) => subs.find((s) => s[4].test(title.trim()))[0];

async function saveImage(url, file) {
  const out = path.join(imgDir, file);
  if (fs.existsSync(out)) return true;
  const r = await fetch(url.replace(/(\?v=\d+)?$/, ""), { headers: { "User-Agent": "Mozilla/5.0" } }).catch(() => null);
  if (!r || !r.ok) return false;
  const buf = Buffer.from(await r.arrayBuffer());
  await sharp(buf).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).webp({ quality: 82 }).toFile(out);
  return true;
}

let nextOrder = Math.max(0, ...catalog.products.map((p) => p.order)) + 1;
let added = 0, updated = 0, skipped = [];
for (const { row, match } of Object.values(matches)) {
  const tx = texts[row.n];
  if (!tx || tx.skip) { skipped.push(`${row.n} ${row.title}`); continue; }
  const id = `wiwu-${row.ean}`;
  const urls = (tx.images ?? match?.images ?? []).slice(0, MAX_IMAGES);
  const images = [];
  for (const [i, u] of urls.entries()) if (await saveImage(u, `${id}-${i + 1}.webp`)) images.push(`/catalog/${id}-${i + 1}.webp`);
  const old = catalog.products.find((p) => p.id === id);
  const p = {
    id,
    category: catOf(row.title),
    codes: [tx.code ?? row.ean, row.ean].filter((v, i, a) => v && a.indexOf(v) === i),
    title: tx.title,
    short: tx.short,
    features: tx.features,
    specs: [{ k: { ru: "Бренд", en: "Brand", uz: "Brend" }, v: "WIWU" }, ...(tx.specs ?? []), { k: { ru: "Штрихкод", en: "Barcode (EAN)", uz: "Shtrixkod" }, v: row.ean }],
    included: tx.included ?? [],
    images,
    unit: "pcs",
    brand: "WIWU",
    availability: "stock",
    leadTime: null,
    badges: old?.badges ?? [],
    minQty: 1,
    costUsd: row.cost,
    markup: row.cost <= 10 ? { mode: "pct", value: 50 } : null, // как у остального каталога: до 10 $ — 50 %, иначе общая 40 %
    price: old?.price ?? null,
    // Сразу на сайт — только подтверждённая модель с фото; остальное — скрытый черновик для проверки в админке.
    published: old ? old.published : images.length > 0 && tx.verified !== false,
    order: old?.order ?? nextOrder++,
  };
  if (old) { Object.assign(old, p); updated++; } else { catalog.products.push(p); added++; }
  console.log(row.n, id, p.category, images.length, "фото");
}
fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 1));
console.log(`Готово: добавлено ${added}, обновлено ${updated}, пропущено ${skipped.length}`);
if (skipped.length) console.log("Пропущены:\n" + skipped.join("\n"));

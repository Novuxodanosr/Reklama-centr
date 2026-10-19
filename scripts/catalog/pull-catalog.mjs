// Забрать актуальный каталог с хостинга перед сборкой сайта: правки из админки (цены, тексты, новые товары)
// попадают в статические страницы. Запуск: node scripts/catalog/pull-catalog.mjs
// Публичная выгрузка (/api/catalog) не содержит себестоимость — поэтому costUsd берём из локального data/catalog.json.
import fs from "node:fs";
const local = JSON.parse(fs.readFileSync("data/catalog.json", "utf8"));
const res = await fetch("https://reklama-centr.uz/api/catalog", { cache: "no-store" });
if (!res.ok) throw new Error("api/catalog: " + res.status);
const live = await res.json();
const cost = Object.fromEntries(local.products.map((p) => [p.id, p.costUsd ?? null]));
const merged = {
  settings: { ...local.settings, ...live.settings },
  categories: live.categories,
  products: live.products.map((p) => ({ ...p, costUsd: cost[p.id] ?? null })),
};
// Скрытые в админке товары в публичной выгрузке отсутствуют — сохраняем их локально как неопубликованные.
for (const p of local.products) if (!merged.products.some((q) => q.id === p.id)) merged.products.push({ ...p, published: false });
fs.writeFileSync("data/catalog.json", JSON.stringify(merged, null, 1));
console.log(`catalog.json обновлён: ${merged.products.length} товаров, цены ${merged.settings.showPrices ? "показаны" : "скрыты"}`);

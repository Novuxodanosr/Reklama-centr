// Забрать актуальный каталог с хостинга перед сборкой сайта: правки из админки (цены, тексты, новые товары)
// попадают в статические страницы. Запуск: node scripts/catalog/pull-catalog.mjs
// Публичная выгрузка (/api/catalog) не содержит себестоимость и наценки — их берём из локального data/catalog.json.
// Внимание: если наценку товара меняли в админке, она приедет только через «Скачать catalog.json» в настройках админки.
import fs from "node:fs";
const local = JSON.parse(fs.readFileSync("data/catalog.json", "utf8"));
const res = await fetch("https://reklama-centr.uz/api/catalog", { cache: "no-store" });
if (!res.ok) throw new Error("api/catalog: " + res.status);
const live = await res.json();
const cost = Object.fromEntries(local.products.map((p) => [p.id, p.costUsd ?? null]));
const markup = Object.fromEntries(local.products.map((p) => [p.id, p.markup ?? null]));
const merged = {
  settings: { ...local.settings, ...live.settings },
  categories: live.categories,
  // priceAuto — цена посчитана по формуле, а не введена вручную: храним пусто, чтобы она пересчитывалась.
  products: live.products.map(({ priceAuto, ...p }) => ({ ...p, price: priceAuto ? null : p.price, costUsd: cost[p.id] ?? null, markup: markup[p.id] ?? null })),
};
// Скрытые в админке товары в публичной выгрузке отсутствуют — сохраняем их локально как неопубликованные.
for (const p of local.products) if (!merged.products.some((q) => q.id === p.id)) merged.products.push({ ...p, published: false });
fs.writeFileSync("data/catalog.json", JSON.stringify(merged, null, 1));
console.log(`catalog.json обновлён: ${merged.products.length} товаров, цены ${merged.settings.showPrices ? "показаны" : "скрыты"}`);

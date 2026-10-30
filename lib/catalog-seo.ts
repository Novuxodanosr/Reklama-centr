import "server-only";
import { catalog, formatPrice, l10n, productsIn, type Category, type Product } from "./catalog";
import type { Locale } from "./site";

// Заголовки и описания магазина для поисковиков. Товары «в наличии» — под запросы «купить … в Ташкенте, цена»,
// «под заказ» (сувениры) — под «… с логотипом». Цены — те же, что на странице (без себестоимости).
const city = { ru: "в Ташкенте", en: "in Tashkent", uz: "Toshkentda" };

const minPrice = (items: Product[]) => {
  const prices = items.map((p) => p.price).filter((n): n is number => !!n);
  return prices.length && catalog.settings.showPrices ? Math.min(...prices) : null;
};
const models = (n: number, L: Locale) => {
  if (L === "en") return `${n} model${n === 1 ? "" : "s"}`;
  if (L === "uz") return `${n} ta model`;
  const k = n % 10, h = n % 100;
  return `${n} ${k === 1 && h !== 11 ? "модель" : k >= 2 && k <= 4 && (h < 12 || h > 14) ? "модели" : "моделей"}`;
};
const inStock = (items: Product[]) => items.filter((p) => p.availability !== "order").length > items.length / 2;

export function categorySeo(c: Category, L: Locale) {
  const items = productsIn(c.id);
  const name = l10n(c.title, L);
  const min = minPrice(items);
  const from = min ? formatPrice(min, catalog.settings.currency, L) : null;
  const n = items.length;
  if (inStock(items)) {
    return {
      title: { ru: `${name} — купить ${city.ru}, цены`, en: `${name} — buy ${city.en}, prices`, uz: `${name} — ${city.uz} sotib olish, narxlar` }[L],
      description: {
        ru: `${name} в наличии ${city.ru}: ${models(n, L)}${from ? `, цены от ${from}` : ""}. Оригинальные товары, оплата в сумах по курсу, доставка по Ташкенту. Нанесём логотип для корпоративных подарков.`,
        en: `${name} in stock ${city.en}: ${models(n, L)}${from ? `, prices from ${from}` : ""}. Genuine products, payment in UZS at the current rate, delivery across Tashkent. Logo branding for corporate gifts.`,
        uz: `${name} ${city.uz} mavjud: ${models(n, L)}${from ? `, narxi ${from} dan` : ""}. Original mahsulotlar, kurs bo‘yicha so‘mda to‘lov, Toshkent bo‘ylab yetkazib berish. Korporativ sovg‘alarga logotip tushiramiz.`,
      }[L],
    };
  }
  return {
    title: { ru: `${name} с логотипом ${city.ru} — под заказ`, en: `${name} with logo branding ${city.en} — made to order`, uz: `${name} logotip bilan ${city.uz} — buyurtma asosida` }[L],
    description: {
      ru: `${name} с логотипом под заказ ${city.ru}: ${models(n, L)}${from ? ` от ${from} за штуку` : ""}. Нанесение логотипа, тираж для корпоративных подарков, доставка по Ташкенту.`,
      en: `${name} with your logo, made to order ${city.en}: ${models(n, L)}${from ? ` from ${from} per unit` : ""}. Logo branding, batches for corporate gifts, delivery across Tashkent.`,
      uz: `${name} logotip bilan buyurtma asosida ${city.uz}: ${models(n, L)}${from ? `, donasi ${from} dan` : ""}. Logotip tushirish, korporativ sovg‘alar uchun partiya, Toshkent bo‘ylab yetkazib berish.`,
    }[L],
  };
}

export function productSeo(p: Product, L: Locale) {
  const name = l10n(p.title, L);
  const price = p.price && catalog.settings.showPrices ? formatPrice(p.price, catalog.settings.currency, L) : null;
  const short = l10n(p.short, L);
  if (p.availability !== "order") {
    return {
      title: { ru: `${name} — купить ${city.ru}${price ? `, цена ${price}` : ""}`, en: `${name} — buy ${city.en}${price ? `, price ${price}` : ""}`, uz: `${name} — ${city.uz} sotib olish${price ? `, narxi ${price}` : ""}` }[L],
      description: [short, { ru: `В наличии ${city.ru}${price ? `, цена ${price}` : ""}. Доставка по Ташкенту.`, en: `In stock ${city.en}${price ? `, price ${price}` : ""}. Delivery across Tashkent.`, uz: `${city.uz} mavjud${price ? `, narxi ${price}` : ""}. Toshkent bo‘ylab yetkazib berish.` }[L]].filter(Boolean).join(" "),
    };
  }
  return {
    title: { ru: `${name} с логотипом — ${city.ru}`, en: `${name} with logo branding — ${city.en}`, uz: `${name} logotip bilan — ${city.uz}` }[L],
    description: [short, { ru: `Под заказ с нанесением логотипа${price ? `, от ${price} за штуку` : ""}.`, en: `Made to order with your logo${price ? `, from ${price} per unit` : ""}.`, uz: `Logotip tushirib, buyurtma asosida${price ? `, donasi ${price} dan` : ""}.` }[L]].filter(Boolean).join(" "),
  };
}

// schema.org: «под заказ» — BackOrder, «нет в наличии» — OutOfStock.
export const schemaAvailability = (p: Product) =>
  `https://schema.org/${p.availability === "order" ? "BackOrder" : p.availability === "none" ? "OutOfStock" : "InStock"}`;

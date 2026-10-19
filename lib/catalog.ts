import type { Locale } from "./site";
import raw from "@/data/catalog.json";

// Каталог товаров. Источник — data/catalog.json (правится в админке /admin/ на хостинге и копируется сюда
// перед сборкой: scripts/catalog/pull-catalog.mjs). Себестоимость (costUsd) на страницы не попадает: см. publicCatalog().
export type L10n = Record<Locale, string>;
export type Category = { id: string; parent: string | null; title: L10n; order: number };
export type Product = {
  id: string;
  category: string;
  codes: string[];
  title: L10n;
  short: L10n;
  features: Record<Locale, string[]>;
  specs: { k: L10n; v: L10n | string }[];
  included: L10n[];
  images: string[];
  priceUzs: number | null;
  published: boolean;
  order: number;
};
export type CatalogSettings = { showPrices: boolean; priceStep: number; minQty: number };
export type PublicCatalog = { settings: CatalogSettings; categories: Category[]; products: Product[] };

type RawProduct = Product & { costUsd?: number | null };
type RawCatalog = { settings: CatalogSettings & { usdRate: number; markupPct: number }; categories: Category[]; products: RawProduct[] };

// Публичная часть: без себестоимости и без скрытых товаров. Эту же форму отдаёт api/catalog.php на хостинге.
export function publicCatalog(data: RawCatalog = raw as RawCatalog): PublicCatalog {
  return {
    settings: { showPrices: data.settings.showPrices, priceStep: data.settings.priceStep, minQty: data.settings.minQty },
    categories: [...data.categories].sort((a, b) => a.order - b.order),
    products: data.products
      .filter((p) => p.published)
      .sort((a, b) => a.order - b.order)
      .map(({ costUsd: _cost, ...p }) => p),
  };
}

export const catalog = publicCatalog();
export const rootCategories = catalog.categories.filter((c) => !c.parent);
export const childCategories = (parent: string) => catalog.categories.filter((c) => c.parent === parent);
export const categoryById = (id: string) => catalog.categories.find((c) => c.id === id);
export const productsIn = (category: string) => catalog.products.filter((p) => p.category === category);
export const productById = (id: string) => catalog.products.find((p) => p.id === id);

export const l10n = (v: L10n | string, locale: Locale) => (typeof v === "string" ? v : v[locale] || v.ru);
export const formatUzs = (n: number) => new Intl.NumberFormat("ru-RU").format(n).replace(/ /g, " ") + " сум";

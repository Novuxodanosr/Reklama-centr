import "server-only";
import raw from "@/data/catalog.json";
import type { CatalogSettings, Category, Product, PublicCatalog } from "./catalog-shared";

export * from "./catalog-shared";

// Каталог товаров — только для серверных компонентов и сборки. Источник — data/catalog.json
// (правится в админке /admin/ на хостинге; перед сборкой забирается scripts/catalog/pull-catalog.mjs).
// Себестоимость (costUsd) и наценки на страницы не попадают: см. publicCatalog().
type RawProduct = Product & { costUsd?: number | null; markup?: unknown };
type RawCatalog = { settings: CatalogSettings & Record<string, unknown>; categories: Category[]; products: RawProduct[] };

export function publicCatalog(data: RawCatalog = raw as unknown as RawCatalog): PublicCatalog {
  return {
    settings: { showPrices: !!data.settings.showPrices, priceStep: Number(data.settings.priceStep) || 1000, minQty: Number(data.settings.minQty) || 1 },
    categories: [...data.categories].sort((a, b) => a.order - b.order),
    products: data.products
      .filter((p) => p.published)
      .sort((a, b) => a.order - b.order)
      .map(({ costUsd: _cost, markup: _markup, ...p }) => p),
  };
}

export const catalog = publicCatalog();
export const rootCategories = catalog.categories.filter((c) => !c.parent);
export const childCategories = (parent: string) => catalog.categories.filter((c) => c.parent === parent);
export const categoryById = (id: string) => catalog.categories.find((c) => c.id === id);
export const productsIn = (category: string) => catalog.products.filter((p) => p.category === category);
export const productById = (id: string) => catalog.products.find((p) => p.id === id);

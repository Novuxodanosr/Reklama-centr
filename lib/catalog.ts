import "server-only";
import raw from "@/data/catalog.json";
import { defaultSettings, type CatalogSettings, type Category, type Markup, type Product, type PublicCatalog } from "./catalog-shared";

export * from "./catalog-shared";

// Каталог товаров — только для серверных компонентов и сборки. Источник — data/catalog.json
// (правится в админке /admin/ на хостинге; перед сборкой забирается scripts/catalog/pull-catalog.mjs).
// Себестоимость (costUsd) и наценки на страницы не попадают: см. publicCatalog().
type RawProduct = Product & { costUsd?: number | null; markup?: Markup };
type RawSettings = CatalogSettings & { usdRate?: number; markupMode?: "pct" | "abs"; markupValue?: number };
type RawCatalog = { settings: RawSettings; categories: Category[]; products: RawProduct[] };

// Цена из себестоимости — та же формула, что в api/catalog-lib.php (catalog_price):
// в долларах база = себестоимость, в сумах — себестоимость × курс; затем наценка товара или общая (% или сумма); округление до шага.
export function priceFromCost(s: RawSettings, costUsd: number | null | undefined, markup: Markup = null): number | null {
  if (!costUsd) return null;
  const mode = markup?.mode ?? s.markupMode ?? "pct";
  const value = Number(markup?.value ?? s.markupValue ?? 0);
  const base = s.currency === "uzs" ? costUsd * Number(s.usdRate || 0) : costUsd;
  const price = mode === "abs" ? base + value : base * (1 + value / 100);
  const step = Number(s.priceStep) > 0 ? Number(s.priceStep) : 1;
  return Math.round(Math.ceil(price / step - 1e-9) * step * 100) / 100;
}

export function publicCatalog(data: RawCatalog = raw as unknown as RawCatalog): PublicCatalog {
  const s = { ...defaultSettings, ...data.settings, showPrices: !!data.settings.showPrices };
  if (s.currency !== "uzs") s.currency = "usd";
  if (!(Number(s.priceStep) > 0)) s.priceStep = defaultSettings.priceStep;
  if (!(Number(s.minQty) > 0)) s.minQty = defaultSettings.minQty;
  return {
    settings: { showPrices: s.showPrices, currency: s.currency, priceStep: Number(s.priceStep), minQty: Number(s.minQty) },
    categories: [...data.categories].sort((a, b) => a.order - b.order),
    products: data.products
      .filter((p) => p.published)
      .sort((a, b) => a.order - b.order)
      .map(({ costUsd, markup, ...p }) => ({ ...p, price: p.price ?? priceFromCost(s, costUsd, markup ?? null) })),
  };
}

export const catalog = publicCatalog();
export const rootCategories = catalog.categories.filter((c) => !c.parent);
export const childCategories = (parent: string) => catalog.categories.filter((c) => c.parent === parent);
export const categoryById = (id: string) => catalog.categories.find((c) => c.id === id);
export const productsIn = (category: string) => catalog.products.filter((p) => p.category === category);
export const productById = (id: string) => catalog.products.find((p) => p.id === id);

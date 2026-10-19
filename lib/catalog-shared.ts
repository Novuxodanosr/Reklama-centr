import type { Locale } from "./site";

// Типы и мелкие функции каталога без данных — безопасно импортировать в клиентские компоненты
// (сами данные data/catalog.json подключает только серверный lib/catalog.ts, чтобы не раздувать страницы).
export type L10n = Record<Locale, string>;
export type Category = { id: string; parent: string | null; title: L10n; order: number };
export type Unit = "pcs" | "m2";
export type Markup = { mode: "pct" | "abs"; value: number } | null;
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
  unit?: Unit;
  priceUzs: number | null;
  published: boolean;
  order: number;
};
export type CatalogSettings = { showPrices: boolean; priceStep: number; minQty: number };
export type PublicCatalog = { settings: CatalogSettings; categories: Category[]; products: Product[] };

export const l10n = (v: L10n | string, locale: Locale) => (typeof v === "string" ? v : v[locale] || v.ru);
export const formatUzs = (n: number) => new Intl.NumberFormat("ru-RU").format(n).replace(/ /g, " ") + " сум";

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import type { CatalogSettings, Product } from "@/lib/catalog-shared";
import { ArrowIcon } from "@/components/icons";
import ProductCard, { PayNote } from "./ProductCard";
import { useLiveCatalog } from "./useLiveCatalog";

// Сетка товаров категории: со сборки приходят только товары этой категории; правки из админки подтягиваются живьём.
export default function CategoryGrid({ category, products: initial, settings: initialSettings }: { category: string; products: Product[]; settings: CatalogSettings }) {
  const t = useTranslations("catalog");
  const live = useLiveCatalog();
  const products = live ? live.products.filter((p) => p.category === category) : initial;
  const settings = live?.settings ?? initialSettings;
  if (products.length === 0) {
    return (
      <div className="mt-10 rounded-xl border border-white/10 p-10 text-center">
        <p className="text-mist">{t("empty")}</p>
        <Link href="/contacts#form" className="btn-primary mt-6">{t("request")} <ArrowIcon /></Link>
      </div>
    );
  }
  return (
    <>
      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-sm text-dim">{t("items", { n: products.length })}</p>
        <PayNote settings={settings} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => <ProductCard key={p.id} product={p} settings={settings} />)}
      </div>
    </>
  );
}

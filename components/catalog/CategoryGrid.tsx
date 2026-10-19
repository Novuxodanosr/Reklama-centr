"use client";

import { useTranslations } from "next-intl";
import { catalog as staticCatalog } from "@/lib/catalog";
import ProductCard from "./ProductCard";
import { useLiveCatalog } from "./useLiveCatalog";

// Сетка товаров категории: сначала статические данные сборки, затем — живые из админки.
export default function CategoryGrid({ category }: { category: string }) {
  const t = useTranslations("catalog");
  const live = useLiveCatalog();
  const data = live ?? staticCatalog;
  const products = data.products.filter((p) => p.category === category);
  return (
    <>
      <p className="mt-6 text-sm text-dim">{t("items", { n: products.length })}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => <ProductCard key={p.id} product={p} settings={data.settings} />)}
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { PublicCatalog } from "@/lib/catalog";

// Живые данные каталога с хостинга (/api/catalog → api/catalog.php). Страницы собраны статически из data/catalog.json,
// а правки из админки (цены, тексты, новые товары) подтягиваются при открытии страницы без пересборки сайта.
let cache: PublicCatalog | null = null;
let pending: Promise<PublicCatalog | null> | null = null;

export function useLiveCatalog(): PublicCatalog | null {
  const [data, setData] = useState<PublicCatalog | null>(cache);
  useEffect(() => {
    if (cache) return;
    pending ??= fetch("/api/catalog", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<PublicCatalog>) : null))
      .catch(() => null)
      .then((d) => { cache = d && Array.isArray(d.products) ? d : null; return cache; });
    pending.then((d) => { if (d) setData(d); });
  }, []);
  return data;
}

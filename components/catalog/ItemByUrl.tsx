"use client";

import { useEffect, useState } from "react";
import ProductView from "./ProductView";

// id товара — из адреса /catalog/<категория>/<id>/ (или ?id=), см. app/[locale]/catalog/item/page.tsx.
export default function ItemByUrl() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("id");
    const m = window.location.pathname.match(/\/catalog\/[^/]+\/([^/]+)\/?$/);
    setId(q || (m && m[1] !== "item" ? m[1] : null));
  }, []);
  if (!id) return null;
  return <ProductView id={id} />;
}

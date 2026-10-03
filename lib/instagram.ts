"use client";

import { useEffect, useState } from "react";
import { serviceIds, type ServiceId } from "./services";
import type { Work } from "./works";

// Свежие работы из Instagram @reklama.centr.uz. Их собирает scripts/static/api/instagram.php на хостинге:
// посты с хештегом направления (#вывески, #стенды, #сувениры…), фото сохраняются на сайте.
// На localhost PHP нет — запрос не удаётся, и страница просто показывает ручное портфолио.
export function useInstagramWorks(): Work[] {
  const [list, setList] = useState<Work[]>([]);
  useEffect(() => {
    let alive = true;
    fetch("/api/instagram")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (!alive || !Array.isArray(data)) return;
        const ok = data.filter(
          (w): w is Work => !!w && typeof w.id === "string" && typeof w.image === "string" && (serviceIds as readonly string[]).includes(w.service as ServiceId),
        );
        setList(ok);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return list;
}

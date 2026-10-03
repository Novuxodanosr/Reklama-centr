import type { ServiceId } from "./services";

// Отрасли клиентов. Тексты — messages/*.json → industries.items.<id>.
// services — какие направления показываем для отрасли,
// work — id проекта из lib/works.ts, чьё фото стоит фоном карточки.
export const industryIds = ["retail", "finance", "horeca", "medical", "realty", "industry", "transport"] as const;
export type IndustryId = (typeof industryIds)[number];

export const industryMeta: Record<IndustryId, { services: ServiceId[]; work: string }> = {
  retail: { services: ["outdoor", "pos", "interior", "promo"], work: "italica-sign" },
  finance: { services: ["interior", "outdoor", "promo", "print"], work: "octobank-pavilion" },
  horeca: { services: ["outdoor", "interior", "print", "textile"], work: "mexxi-stand" },
  medical: { services: ["interior", "outdoor", "promo", "exhibition"], work: "clinic-nav" },
  realty: { services: ["outdoor", "interior", "custom", "print"], work: "golden-house-facade" },
  industry: { services: ["interior", "exhibition", "textile", "heraldry"], work: "tmz-pylon" },
  transport: { services: ["outdoor", "interior", "textile", "print"], work: "ambulance-103" },
};

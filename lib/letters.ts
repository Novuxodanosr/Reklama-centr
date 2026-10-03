// Благодарственные письма клиентов (сканы — public/letters/<id>.webp).
// Письма адресованы ООО «Premium Selection» — это юридическое лицо, в составе которого работает
// производство Reklama Centr (решение заказчика 13.09.2026). Цитаты, имена и должности — в
// messages/*.json → testimonials.items.<id>. client — id логотипа из lib/clients.ts (если есть).
export type Letter = { id: string; image: string; client?: string; date: string };

export const letters: Letter[] = [
  { id: "octobank", image: "/letters/octobank.webp", client: "octobank", date: "2025-12" },
  { id: "paynet", image: "/letters/paynet.webp", client: "paynet", date: "2025-09" },
  { id: "theonealma", image: "/letters/theonealma.webp", client: "theonealma", date: "2025-09" },
  { id: "lem-agency", image: "/letters/lem-agency.webp", date: "2025-08" },
];

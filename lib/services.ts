export const serviceIds = ["print", "promo", "textile", "pos", "exhibition", "heraldry", "outdoor", "interior", "custom"] as const;

export type ServiceId = (typeof serviceIds)[number];

// Фото направления. Где фото пока нет — показываем типографскую плитку.
export const serviceImages: Partial<Record<ServiceId, string>> = {
  print: "/works/dilbar-tags.webp",
  promo: "/works/alfabank-set.webp",
  textile: "/works/samsung-plaid.webp",
  pos: "/works/josera-display.webp",
  exhibition: "/works/octobank-expo-wide.webp",
  heraldry: "/works/heraldry-star.webp",
  outdoor: "/works/octobank-pavilion.webp",
  interior: "/works/tmz-hall.webp",
  custom: "/works/oz-makon-night.webp",
};

export const serviceIcons: Record<ServiceId, string> = {
  print: "M6 4h12v6H6zM4 10h16v8H4zM8 18v2h8v-2",
  promo: "M4 9h16v11H4zM4 9l2-4h12l2 4M12 5v15",
  textile: "M8 4l4 2 4-2 4 4-3 2v10H7V10L4 8z",
  pos: "M4 6h16v4H4zM6 10v10M18 10v10M6 15h12",
  exhibition: "M3 4h18v11H3zM8 15l-1 5M16 15l1 5M5 20h14M9 8h6",
  heraldry: "M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z",
  outdoor: "M4 4h16v10H4zM10 14v6M14 14v6M12 20h0",
  interior: "M3 20h18M5 20V8l7-4 7 4v12M9 20v-6h6v6",
  custom: "M4 20l4-1 10-10-3-3L5 16zM13 7l3 3M15 4l1-1 4 4-1 1",
};

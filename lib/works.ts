import type { ServiceId } from "./services";
import type { IndustryId } from "./industries";

export type Work = {
  id: string;
  service: ServiceId;
  image: string;
  industries?: IndustryId[];
  gallery?: string[]; // дополнительные кадры серии — листаются в просмотре после обложки
  video?: string; // короткий ролик без звука (public/video), в просмотре идёт сразу после обложки
  // Работы из Instagram (lib/instagram.ts) несут свои подписи — у ручных работ они в messages → works.items.
  title?: string;
  client?: string;
  link?: string; // пост в Instagram
};

// Реальные проекты из архива компании (папка «Портфолио» + Telegram-канал). Порядок = порядок в сетке.
// Подписи и клиент — в messages/*.json → works.items.<id>. Фото — public/works/<id>.webp.
export const works: Work[] = [
  { id: "octobank-pavilion", service: "outdoor", image: "/works/octobank-pavilion.webp", industries: ["finance"], gallery: ["/works/ps-octobank-pavilion-99.webp", "/works/ps-octobank-pavilion-100.webp"] },
  { id: "ipoteka-rooftops", service: "outdoor", image: "/works/ipoteka-night-close.webp", industries: ["finance"], gallery: ["/works/ipoteka-night-wide.webp", "/works/ipoteka-day-balconies.webp", "/works/ipoteka-qarshi-2.webp", "/works/ipoteka-night-tower-2.webp", "/works/ipoteka-day-crane.webp", "/works/ipoteka-day-sqb.webp", "/works/ipoteka-roof-install.webp", "/works/ipoteka-roof-red.webp", "/works/ipoteka-qarshi.webp", "/works/ipoteka-night-tower.webp"] },
  { id: "tmz-hall", service: "interior", image: "/works/tmz-hall.webp", industries: ["industry"], gallery: ["/works/ps-tmz-hall-60.webp", "/works/ps-tmz-hall-70.webp"] },
  { id: "infinity-letters", service: "outdoor", image: "/works/infinity-letter.webp", industries: ["realty"], video: "/video/infinity-story.mp4", gallery: ["/works/infinity-result.webp", "/works/infinity-rooftop.webp", "/works/infinity-rooftop-2.webp", "/works/infinity-crane.webp", "/works/infinity-gh-logo.webp", "/works/infinity-letter-wide.webp"] },
  { id: "akfa-showroom", service: "interior", image: "/works/akfa-showroom.webp", industries: ["retail", "industry"] },
  { id: "golden-house", service: "interior", image: "/works/golden-house.webp", industries: ["realty"], gallery: ["/works/ps-golden-house-66.webp", "/works/ps-golden-house-67.webp"] },
  { id: "tmz-navigation", service: "outdoor", image: "/works/tmz-stele-night.webp", industries: ["industry", "realty"], gallery: ["/works/tmz-plan-night.webp", "/works/tmz-plan-day.webp", "/works/tmz-stele-production.webp"] },
  { id: "octobank-giftset", service: "promo", image: "/works/octobank-set-box.webp", industries: ["finance"], gallery: ["/works/octobank-set-macro.webp", "/works/octobank-set-top.webp"] },
  { id: "lavazza-point", service: "pos", image: "/works/lavazza-point.webp", industries: ["horeca", "retail"], video: "/video/lavazza-point.mp4", gallery: ["/works/lavazza-point-2.webp", "/works/lavazza-relief.webp"] },
  { id: "powerbank-uv", service: "promo", image: "/works/powerbank-batch.webp", gallery: ["/works/powerbank-batch-2.webp", "/works/powerbank-single.webp", "/works/powerbank-macro.webp"] },
  { id: "tmz-meeting", service: "interior", image: "/works/tmz-meeting-room.webp", industries: ["industry"], gallery: ["/works/tmz-meeting-flag.webp", "/works/tmz-meeting-logo.webp"] },
  { id: "tmz-facade", service: "outdoor", image: "/works/tmz-facade-night.webp", industries: ["industry"], gallery: ["/works/tmz-shop-logo.webp"] },
  { id: "italica-sign", service: "outdoor", image: "/works/italica-sign.webp", industries: ["retail"] },
  { id: "tmz-place-card", service: "promo", image: "/works/tmz-place-card-macro.webp", industries: ["industry"], gallery: ["/works/tmz-place-card.webp"] },
  { id: "infinity-stele", service: "outdoor", image: "/works/infinity-stele.webp", industries: ["realty"], video: "/video/infinity-stele.mp4" },
  { id: "lavazza-island", service: "pos", image: "/works/lavazza-island.webp", industries: ["retail", "horeca"] },
  { id: "gov-stand", service: "exhibition", image: "/works/gov-stand.webp" },
  { id: "octobank-expo", service: "exhibition", image: "/works/octobank-expo.webp", industries: ["finance"] },
  { id: "tmz-pylon", service: "outdoor", image: "/works/tmz-pylon.webp", industries: ["industry"] },
  { id: "dilbar-tags", service: "print", image: "/works/dilbar-tags.webp", industries: ["retail"], gallery: ["/works/ps-dilbar-tags-13.webp"] },
  { id: "oz-makon-night", service: "outdoor", image: "/works/oz-makon-night.webp", industries: ["realty"], gallery: ["/works/oz-makon.webp", "/works/oz-makon-logo.webp", "/works/ps-oz-makon-night-69.webp"] },
  { id: "ambulance-103", service: "outdoor", image: "/works/vw-caddy-side.webp", industries: ["medical", "transport"], gallery: ["/works/vw-plant-2.webp", "/works/vw-plant-1.webp", "/works/vw-caddy-front34.webp", "/works/vw-caddy-rear34.webp", "/works/vw-caddy-hood.webp", "/works/ps-ambulance-103-49.webp", "/works/ps-ambulance-103-50.webp", "/works/ps-ambulance-103-51.webp"] },
  { id: "eriell-wayfinding", service: "interior", image: "/works/eriell-floor8.webp", industries: ["industry"], gallery: ["/works/eriell-sign.webp", "/works/eriell-rig.webp", "/works/eriell-logo-macro.webp", "/works/ps-eriell-wayfinding-62.webp"] },
  { id: "octobank-facade", service: "outdoor", image: "/works/octobank-facade.webp", industries: ["finance"], gallery: ["/works/ps-octobank-facade-94.webp", "/works/ps-octobank-facade-95.webp", "/works/ps-octobank-facade-96.webp", "/works/ps-octobank-facade-97.webp"] },
  { id: "rooftop-letters", service: "outdoor", image: "/works/rooftop-letters.webp", industries: ["realty"] },
  { id: "paynet-letters", service: "interior", image: "/works/paynet-letters.webp", industries: ["finance"], gallery: ["/works/ps-paynet-letters-16.webp"] },
  { id: "alfabank-set", service: "promo", image: "/works/alfabank-set.webp", industries: ["finance"], gallery: ["/works/ps-alfabank-set-77.webp", "/works/ps-alfabank-set-78.webp", "/works/ps-alfabank-set-79.webp"] },
  { id: "gift-set", service: "promo", image: "/works/gift-set.webp", industries: ["finance"] },
  { id: "newyear-set", service: "promo", image: "/works/newyear-set.webp", industries: ["finance"], gallery: ["/works/ps-newyear-set-58.webp"] },
  { id: "leading-set", service: "promo", image: "/works/leading-set.webp", industries: ["industry"], gallery: ["/works/ps-leading-set-52.webp"] },
  { id: "gov-set", service: "promo", image: "/works/gov-set.webp", gallery: ["/works/ps-gov-set-54.webp"] },
  { id: "savdo-center", service: "outdoor", image: "/works/savdo-center.webp", industries: ["realty", "industry"], gallery: ["/works/tmz-sales-office.webp"] },
  { id: "heraldry-star", service: "heraldry", image: "/works/heraldry-star.webp", industries: ["industry"] },
  { id: "crystal-award", service: "heraldry", image: "/works/crystal-award.webp", industries: ["industry"], gallery: ["/works/ps-crystal-award-10.webp"] },
  { id: "heraldry-medal", service: "heraldry", image: "/works/heraldry-medal.webp", industries: ["industry"] },
  { id: "heraldry-pin", service: "heraldry", image: "/works/heraldry-pin.webp", industries: ["industry"] },
  { id: "ipotekabank-counter", service: "pos", image: "/works/ipotekabank-counter.webp", industries: ["finance"], gallery: ["/works/ps-ipotekabank-counter-74.webp", "/works/ps-ipotekabank-counter-76.webp"] },
  { id: "mexxi-stand", service: "exhibition", image: "/works/mexxi-stand.webp", industries: ["horeca"] },
  { id: "tmz-reception", service: "pos", image: "/works/tmz-reception.webp", industries: ["industry"] },
  { id: "clinic-nav", service: "interior", image: "/works/clinic-nav.webp", industries: ["medical"] },
  { id: "xalqbank-cap", service: "textile", image: "/works/xalqbank-cap.webp", industries: ["finance"], gallery: ["/works/ps-xalqbank-cap-3.webp"] },
  { id: "samsung-plaid", service: "textile", image: "/works/samsung-plaid.webp", industries: ["retail"], gallery: ["/works/ps-samsung-plaid-17.webp"] },
  { id: "zarqand-backpack", service: "textile", image: "/works/zarqand-backpack.webp", industries: ["retail"] },
  { id: "gold-cards", service: "print", image: "/works/gold-cards.webp", industries: ["realty"] },
  { id: "navruz-coasters", service: "promo", image: "/works/navruz-coasters.webp", industries: ["realty"] },
  { id: "bilim-ziyo-mug", service: "promo", image: "/works/bilim-ziyo-mug.webp" },
  { id: "tmz-clock", service: "promo", image: "/works/tmz-clock.webp", industries: ["industry"] },
  { id: "octobank-thermos", service: "promo", image: "/works/octobank-thermos.webp", industries: ["finance"], gallery: ["/works/ps-octobank-thermos-64.webp"] },
  { id: "dr-reddys", service: "promo", image: "/works/dr-reddys.webp", industries: ["medical"] },
  { id: "josera-display", service: "pos", image: "/works/josera-display.webp", industries: ["retail"], gallery: ["/works/ps-josera-display-72.webp", "/works/ps-josera-display-73.webp"] },
  { id: "office-map-wall", service: "interior", image: "/works/eriell-lobby.webp", industries: ["industry"] },
  { id: "event-badges", service: "print", image: "/works/event-badges.webp" },
  { id: "vero-catalog", service: "print", image: "/works/vero-catalog.webp", industries: ["industry"] },
  { id: "uv-printer", service: "print", image: "/works/uv-printer.webp", industries: ["industry"] },
  { id: "hospital-lightbox", service: "outdoor", image: "/works/hospital-lightbox.webp", industries: ["medical"] },
  { id: "followme-van", service: "outdoor", image: "/works/followme-van.webp", industries: ["transport"] },
  { id: "golden-house-facade", service: "outdoor", image: "/works/golden-house-facade.webp", industries: ["realty"] },
  { id: "zarqand-tote", service: "promo", image: "/works/zarqand-tote.webp", industries: ["retail"], gallery: ["/works/ps-zarqand-tote-2.webp", "/works/ps-zarqand-tote-7.webp", "/works/ps-zarqand-tote-8.webp"] },
  // Проекты из портфолио ps.com.uz (та же группа компаний; заказчик 02.10.2026: «возьми все и разбей по направлениям»).
  { id: "octobank-lightbox", service: "interior", image: "/works/ps-octobank-lightbox-91.webp", industries: ["finance"], gallery: ["/works/ps-octobank-lightbox-89.webp", "/works/ps-octobank-lightbox-90.webp", "/works/ps-octobank-lightbox-92.webp"] },
  { id: "ipoteka-pins", service: "heraldry", image: "/works/ps-ipoteka-pins-22.webp", industries: ["finance"], gallery: ["/works/ps-ipoteka-pins-23.webp", "/works/ps-ipoteka-pins-24.webp", "/works/ps-ipoteka-pins-25.webp", "/works/ps-ipoteka-pins-28.webp", "/works/ps-ipoteka-pins-29.webp", "/works/ps-ipoteka-pins-30.webp"] },
  { id: "ipoteka-scarves", service: "textile", image: "/works/ps-ipoteka-scarves-31.webp", industries: ["finance"], gallery: ["/works/ps-ipoteka-scarves-32.webp", "/works/ps-ipoteka-scarves-33.webp", "/works/ps-ipoteka-scarves-34.webp", "/works/ps-ipoteka-scarves-35.webp", "/works/ps-ipoteka-scarves-36.webp"] },
  { id: "ipoteka-badges", service: "print", image: "/works/ps-ipoteka-badges-37.webp", industries: ["finance"], gallery: ["/works/ps-ipoteka-badges-38.webp", "/works/ps-ipoteka-badges-39.webp", "/works/ps-ipoteka-badges-40.webp", "/works/ps-ipoteka-badges-41.webp", "/works/ps-ipoteka-badges-46.webp", "/works/ps-ipoteka-badges-47.webp"] },
  { id: "oqtepa-badges", service: "print", image: "/works/ps-oqtepa-badges-43.webp", industries: ["horeca"], gallery: ["/works/ps-oqtepa-badges-42.webp", "/works/ps-oqtepa-badges-44.webp", "/works/ps-oqtepa-badges-45.webp"] },
  { id: "ipoteka-rollup", service: "pos", image: "/works/ps-ipoteka-rollup-81.webp", industries: ["finance"], gallery: ["/works/ps-ipoteka-rollup-82.webp"] },
  { id: "ipoteka-chargers", service: "promo", image: "/works/ps-ipoteka-chargers-84.webp", industries: ["finance"], gallery: ["/works/ps-ipoteka-chargers-83.webp"] },
  { id: "ipoteka-set", service: "promo", image: "/works/ps-ipoteka-set-63.webp", industries: ["finance"] },
  { id: "octobank-ikat", service: "textile", image: "/works/ps-octobank-ikat-85.webp", industries: ["finance"], gallery: ["/works/ps-octobank-ikat-86.webp", "/works/ps-octobank-ikat-87.webp", "/works/ps-octobank-ikat-88.webp"] },
  { id: "paynet-merch", service: "promo", image: "/works/ps-paynet-merch-21.webp", industries: ["finance"] },
  { id: "best-partner", service: "heraldry", image: "/works/ps-best-partner-5.webp", industries: ["industry"], gallery: ["/works/ps-best-partner-6.webp"] },
  { id: "tmz-pin", service: "heraldry", image: "/works/ps-tmz-pin-27.webp", industries: ["industry"], gallery: ["/works/ps-tmz-pin-26.webp"] },
  { id: "uzbek-gift", service: "promo", image: "/works/ps-uzbek-gift-56.webp", gallery: ["/works/ps-uzbek-gift-57.webp"] },
  { id: "turizm-letters", service: "interior", image: "/works/ps-turizm-letters-19.webp" },
  { id: "letters-case", service: "custom", image: "/works/ps-letters-case-14.webp" },
  { id: "gold-folders", service: "print", image: "/works/ps-gold-folders-11.webp" },
];

// Порядок кадров в просмотре: обложка, ролик, затем остальные кадры серии.
export const workFrames = (w: Work) => 1 + (w.video ? 1 : 0) + (w.gallery?.length ?? 0);

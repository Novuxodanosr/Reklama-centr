// Фирменные материалы Instagram @reklama.centr.uz: обложки Highlights и закреплённые карусели.
// Стиль сайта: фон #0B0B0D, бумага #F5F4F0, красный #E4142F, Sofia Sans Extra Condensed, мотив «деления линейки».
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const OUT = "D:/CLAUDE/Сайт Reklama Centr/Instagram";
const FONT = path.join(__dirname, "sofia.ttf"); // шрифт из ASCII-пути: Pango не читает кириллицу в пути
const FAMILY = "Sofia Sans Extra Condensed ExtraBold";
const INK = "#0B0B0D", PAPER = "#F5F4F0", RED = "#E4142F", MIST = "#9A9AA2";
const W = 1080, H = 1350, X = 84;

// Логотип из компонента сайта (components/Logo.tsx) — те же пути, белым.
const logoSrc = fs.readFileSync("D:/CLAUDE/Сайт Reklama Centr/RC/components/Logo.tsx", "utf8");
const logoPaths = logoSrc.match(/<path [^>]*\/>/g).join("");
const logoSvg = (fill, width) => {
  const h = Math.round((width * 135.25) / 503.2);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 503.2 135.25" width="${width}" height="${h}"><g fill="${fill}">${logoPaths}</g></svg>`);
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
async function text(markup, px, opts = {}) {
  const buf = await sharp({ text: { text: markup, font: `${FAMILY}, ${px}`, fontfile: FONT, rgba: true, dpi: 72, width: opts.width, wrap: "word", spacing: opts.spacing, align: opts.align || "left" } }).png().toBuffer();
  const t = await sharp(buf).trim({ threshold: 1 }).png().toBuffer();
  const m = await sharp(t).metadata();
  return { input: t, w: m.width, h: m.height };
}
const span = (color, s, extra = "") => `<span foreground="${color}"${extra}>${esc(s)}</span>`;
const rect = (w, h, color) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${color}"/></svg>`);

// Мотив «деления линейки» внизу слайда — как над блоком этапов на сайте.
const ruler = () => {
  let ticks = "";
  for (let x = 0, i = 0; x <= W; x += 18, i++) ticks += `<rect x="${x}" y="${i % 5 === 0 ? 0 : 14}" width="3" height="${i % 5 === 0 ? 34 : 20}" fill="${i % 5 === 0 ? RED : "#3A3A40"}"/>`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="34">${ticks}</svg>`);
};

async function slide({ file, bg, eyebrow, title, titlePx = 150, body, bodyPx = 50, big, bigLabel, n, total, cta }) {
  const layers = [];
  let base;
  if (bg) {
    base = sharp(bg).resize(W, H, { fit: "cover", position: "attention" });
    layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK}" stop-opacity="0.35"/><stop offset="0.45" stop-color="${INK}" stop-opacity="0.55"/><stop offset="1" stop-color="${INK}" stop-opacity="0.95"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`), left: 0, top: 0 });
  } else {
    base = sharp({ create: { width: W, height: H, channels: 3, background: INK } });
    layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><radialGradient id="r" cx="0.85" cy="0.1" r="0.7"><stop offset="0" stop-color="${RED}" stop-opacity="0.22"/><stop offset="1" stop-color="${RED}" stop-opacity="0"/></radialGradient><rect width="${W}" height="${H}" fill="url(#r)"/></svg>`), left: 0, top: 0 });
  }
  layers.push({ input: logoSvg(PAPER, 260), left: X, top: 76 });
  if (n) {
    const c = await text(span(MIST, `${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`), 40);
    layers.push({ input: c.input, left: W - X - c.w, top: 92 });
  }
  layers.push({ input: ruler(), left: 0, top: H - 34 });

  // Текстовый блок прижат к низу.
  const blocks = [];
  if (eyebrow) blocks.push([await text(span(RED, eyebrow.toUpperCase(), ' letter_spacing="4000"'), 34, { width: W - 2 * X }), 34]);
  if (big) blocks.push([await text(span(RED, big), 230, { width: W - 2 * X }), 18]);
  if (title) {
    // Самое длинное слово должно влезать в строку целиком — иначе уменьшаем кегль.
    const longest = title.toUpperCase().split(/s+/).sort((a, b) => b.length - a.length)[0];
    while (titlePx > 60 && (await text(span(PAPER, longest), titlePx)).w > W - 2 * X) titlePx -= 6;
    blocks.push([await text(span(PAPER, title.toUpperCase()), titlePx, { width: W - 2 * X, spacing: Math.round(-titlePx * 0.12) }), 36]);
  }
  if (bigLabel) blocks.push([await text(span(PAPER, bigLabel), 64, { width: W - 2 * X }), 30]);
  if (body) blocks.push([await text(body, bodyPx, { width: W - 2 * X, spacing: 6 }), 30]);
  if (cta) blocks.push([await text(span(RED, cta), 46, { width: W - 2 * X }), 0]);
  let y = H - 34 - 96 - blocks.reduce((s, [b, gap], i) => s + b.h + (i < blocks.length - 1 ? gap : 0), 0);
  for (const [b, gap] of blocks) { layers.push({ input: b.input, left: X, top: Math.round(y) }); y += b.h + gap; }

  await base.composite(layers).jpeg({ quality: 92, mozjpeg: true }).toFile(file);
}

// ---------- Обложки Highlights: 1080×1920, значок в центре (Instagram обрезает в круг) ----------
const ICONS = {
  "1-keysy": `<rect x="-150" y="-150" width="130" height="130" rx="14"/><rect x="20" y="-150" width="130" height="130" rx="14"/><rect x="-150" y="20" width="130" height="130" rx="14"/><rect x="20" y="20" width="130" height="130" rx="14" class="a"/>`,
  "2-vyveski": `<rect x="-170" y="-90" width="340" height="150" rx="18"/><path d="M-110 60 V130 M110 60 V130 M-150 130 H150"/><path d="M-110 -15 H-30 M10 -15 H110" class="a"/>`,
  "3-stendy": `<path d="M-160 140 V-120 H160 V140"/><path d="M-160 -60 H160"/><rect x="-60" y="10" width="120" height="130" rx="10" class="a"/>`,
  "4-pos": `<path d="M-130 160 V-160 H130 V160"/><path d="M-130 -60 H130 M-130 40 H130 M-130 140 H130"/><rect x="-95" y="-125" width="50" height="50" rx="6" class="a"/><rect x="-20" y="-25" width="50" height="50" rx="6" class="a"/><rect x="55" y="-125" width="40" height="50" rx="6"/>`,
  "5-merch": `<rect x="-150" y="-50" width="300" height="190" rx="14"/><rect x="-170" y="-110" width="340" height="60" rx="12"/><path d="M0 -110 V140" class="a"/><path d="M0 -110 C-40 -180 -120 -170 -90 -120 Z M0 -110 C40 -180 120 -170 90 -120 Z"/>`,
  "6-tseh": `<path d="M-170 150 V-20 L-90 -80 V-20 L-10 -80 V-20 L70 -80 V150 Z"/><path d="M70 150 V-160 H140 V150"/><path d="M-170 150 H170"/><rect x="-130" y="40" width="50" height="50" rx="6" class="a"/><rect x="-40" y="40" width="50" height="50" rx="6" class="a"/>`,
  "7-otzyvy": `<path d="M-170 -130 H170 V80 H-40 L-120 150 V80 H-170 Z"/><path d="M-90 -50 L-70 -10 L-25 -5 L-58 25 L-50 70 L-90 48 L-130 70 L-122 25 L-155 -5 L-110 -10 Z" class="a" transform="translate(30 -20) scale(0.8)"/><path d="M10 -40 H120 M10 10 H90"/>`,
  "8-kak-rabotaem": `<path d="M-100 -120 H150 M-100 0 H150 M-100 120 H150"/><circle cx="-150" cy="-120" r="16" class="a"/><circle cx="-150" cy="0" r="16" class="a"/><circle cx="-150" cy="120" r="16" class="a"/>`,
  "9-kontakty": `<path d="M-120 -150 C-150 -150 -165 -120 -150 -60 C-110 70 -40 130 60 160 C110 170 150 150 150 120 L150 80 L80 40 L40 80 C-20 60 -60 20 -80 -40 L-40 -80 L-80 -150 Z"/><path d="M40 -130 A110 110 0 0 1 140 -30 M40 -70 A50 50 0 0 1 80 -30" class="a"/>`,
};
async function highlights() {
  const dir = path.join(OUT, "highlights");
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, shapes] of Object.entries(ICONS)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="${INK}"/>
      <circle cx="540" cy="960" r="420" fill="none" stroke="${RED}" stroke-width="10" stroke-opacity="0.9"/>
      <g transform="translate(540 960)" fill="none" stroke="${PAPER}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
        <style>.a{stroke:${RED}}</style>${shapes}
      </g></svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(dir, `${name}.png`));
  }
}

// ---------- Закреплённые карусели ----------
async function pinned() {
  const W_ = (id) => `D:/CLAUDE/Сайт Reklama Centr/RC/public/works/${id}.webp`;

  const about = path.join(OUT, "pinned-1-kto-my");
  fs.mkdirSync(about, { recursive: true });
  const services = ["Наружная реклама", "Интерьерное оформление", "Выставочные стенды", "POS и торговое оборудование", "Сувенирная продукция", "Текстиль", "Типография", "Геральдика", "Нестандартные проекты"];
  await slide({ file: `${about}/1.jpg`, bg: W_("infinity-letter"), eyebrow: "Рекламно-производственная компания · Ташкент", title: "Будет забрендировано!", titlePx: 170, body: span(PAPER, "Вывески, стенды, POS, сувениры и всё, что нужно вашему бренду — на собственном производстве."), cta: "Листайте →", n: 1, total: 4 });
  await slide({ file: `${about}/2.jpg`, eyebrow: "Что производим", title: "Всё, что нужно вашему бренду", titlePx: 130, body: services.map((s) => span(PAPER, "— " + s)).join("\n"), bodyPx: 52, n: 2, total: 4 });
  await slide({ file: `${about}/3.jpg`, bg: W_("tmz-stele-night"), eyebrow: "Один подрядчик вместо десяти", title: "Своя линия производства", titlePx: 140, body: span(PAPER, "Собственное оборудование и прямые поставки из Китая, России, Европы, США и Дубая. Без посредников — сроки короче, цены ниже."), n: 3, total: 4 });
  await slide({ file: `${about}/4.jpg`, eyebrow: "Быстрый расчёт", title: "Пришлите задачу — вернёмся с ценой", titlePx: 128, body: span(PAPER, "☎ +998 88 000 61 61\nили напишите в Direct"), bodyPx: 64, cta: "reklama-centr.com", n: 4, total: 4 });

  const why = path.join(OUT, "pinned-2-pochemu-my");
  fs.mkdirSync(why, { recursive: true });
  const tiles = [
    ["Своя линия", "производства — без посредников и лишних наценок", "uv-printer"],
    ["до 5 лет", "гарантии на изделия, монтаж и сервис", "oz-makon-night"],
    ["Образец", "до тиража — никаких сюрпризов в готовой партии", "octobank-set-box"],
    ["Любой масштаб", "от визитки до крышной установки на ЖК INFINITY", "infinity-result"],
  ];
  await slide({ file: `${why}/1.jpg`, bg: W_("golden-house-facade"), eyebrow: "Почему Reklama Centr", title: "4 причины работать с нами", titlePx: 160, cta: "Листайте →", n: 1, total: 5 });
  for (const [i, [v, l, img]] of tiles.entries()) {
    await slide({ file: `${why}/${i + 2}.jpg`, bg: W_(img), eyebrow: `Причина ${i + 1}`, title: v, titlePx: 190, body: span(PAPER, l), bodyPx: 58, n: i + 2, total: 5 });
  }

  const steps = path.join(OUT, "pinned-3-zakaz-7-shagov");
  fs.mkdirSync(steps, { recursive: true });
  const list = [
    ["Расчёт стоимости", "Специалист быстро рассчитает ваш проект и проконсультирует по всем вопросам."],
    ["Разработка макета", "Дизайнер с 30-летним стажем разработает макет с учётом всех ваших пожеланий."],
    ["Технологическая проработка", "Технолог подбирает материалы, крепления и подсветку и фиксирует всё в задании для цеха."],
    ["Договор и предоплата", "Размер предоплаты зависит от проекта: объёма, сложности и сроков."],
    ["Согласование 3D", "Покажем, как будет выглядеть изделие, — в трёхмерной картинке."],
    ["Производство", "Держим в курсе, на каком этапе изготовления ваш заказ."],
    ["Доставка и монтаж", "Сами привезём и смонтируем — успеем к открытию или мероприятию."],
  ];
  await slide({ file: `${steps}/1.jpg`, bg: W_("rooftop-install"), eyebrow: "Порядок работы", title: "Заказ в 7 шагов!", titlePx: 190, cta: "Листайте →", n: 1, total: 8 });
  for (const [i, [t, d]] of list.entries()) {
    await slide({ file: `${steps}/${i + 2}.jpg`, big: String(i + 1).padStart(2, "0"), title: t, titlePx: 120, body: span(PAPER, d), bodyPx: 54, eyebrow: "Шаг", n: i + 2, total: 8 });
  }
}

async function caseInfinity() {
  const dir = path.join(OUT, "pinned-2-keys-infinity");
  fs.mkdirSync(dir, { recursive: true });
  const P = (id) => `D:/CLAUDE/Сайт Reklama Centr/RC/public/works/${id}.webp`;
  await slide({ file: `${dir}/1.jpg`, bg: P("infinity-result"), eyebrow: "Кейс · ЖК INFINITY", title: "Буквы 3,5 м на крыше", titlePx: 170, body: span(PAPER, "Без ферм — на лонжеронной системе. Монтаж краном 200 т."), cta: "Листайте →" });
  const photos = ["infinity-letter", "infinity-crane", "infinity-rooftop", "infinity-rooftop-2", "infinity-letter-wide", "infinity-gh-logo"];
  for (const [i, id] of photos.entries()) {
    await sharp(P(id)).resize(W, H, { fit: "cover", position: "attention" }).jpeg({ quality: 92, mozjpeg: true }).toFile(`${dir}/${i + 2}.jpg`);
  }
  await slide({ file: `${dir}/8.jpg`, eyebrow: "Факты проекта", title: "Инженерия без аналогов", titlePx: 130,
    body: ["Высота букв — более 3,5 м", "Без ферм: лонжеронная система крепления", "Кран 200 т, стрела 108 м", "Два 60-тонных крана и три шаланды", "Вывеску видно с массива Водник"].map((t) => span(PAPER, "— " + t)).join("\n"), bodyPx: 52, cta: "Рассчитаем ваш проект: +998 88 000 61 61" });
}

(async () => {
  await highlights();
  await caseInfinity();
  await pinned();
  console.log("ok");
})().catch((e) => { console.error(e); process.exit(1); });

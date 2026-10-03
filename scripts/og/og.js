// Картинка-превью для ссылок (app/opengraph-image.png, 1200x630): фон + затемнение + строки шрифтом сайта.
// Запуск: npm i sharp --no-save && node scripts/og/og.js  (тексты и слоган правятся ниже).
const sharp = require("sharp");
const path = require("path");
const ROOT = __dirname;
const FONT = path.join(ROOT, "sofia.ttf");
const FAMILY = "Sofia Sans Extra Condensed ExtraBold";
const W = 1200, H = 630, X = 72;
const RED = "#E4142F", PAPER = "#F5F4F0";

async function line(markup, px) {
  const buf = await sharp({ text: { text: markup, font: `${FAMILY}, ${px}`, fontfile: FONT, rgba: true, dpi: 72 } }).png().toBuffer();
  const trimmed = await sharp(buf).trim({ threshold: 1 }).png().toBuffer();
  const m = await sharp(trimmed).metadata();
  return { buf: trimmed, w: m.width, h: m.height };
}
const rect = (w, h, color, alpha) => sharp({ create: { width: w, height: h, channels: 4, background: { ...color, alpha } } }).png().toBuffer();

(async () => {
  const eyebrow = await line(`<span foreground="${RED}" letter_spacing="1500">РЕКЛАМНО-ПРОИЗВОДСТВЕННАЯ КОМПАНИЯ  ·  ТАШКЕНТ</span>`, 25);
  const title = await line(`<span foreground="${PAPER}">REKLAMA CENTR</span>`, 172);
  const slogan = await line(`<span foreground="${RED}">WBB</span><span foreground="${PAPER}"> · БУДЕТ ЗАБРЕНДИРОВАНО!</span>`, 74);
  const facts = await line(`<span foreground="${PAPER}" letter_spacing="1000">СОБСТВЕННОЕ ПРОИЗВОДСТВО   ·   ГАРАНТИЯ ДО 5 ЛЕТ   ·   МОНТАЖ И СЕРВИС</span>`, 27);
  console.log({ eyebrow: [eyebrow.w, eyebrow.h], title: [title.w, title.h], slogan: [slogan.w, slogan.h], facts: [facts.w, facts.h] });
  const factsDim = await sharp(facts.buf).ensureAlpha().composite([{ input: await rect(facts.w, facts.h, { r: 0, g: 0, b: 0 }, 0.28), blend: "dest-out" }]).png().toBuffer();

  await sharp(path.join(ROOT, "og-bg.jpg")).resize(W, H, { fit: "cover" })
    .composite([
      { input: await rect(W, H, { r: 11, g: 11, b: 13 }, 0.42), left: 0, top: 0 },
      { input: await rect(W, H - 256, { r: 11, g: 11, b: 13 }, 0.6), left: 0, top: 256 },
      { input: await rect(W, 10, { r: 228, g: 20, b: 47 }, 1), left: 0, top: H - 10 },
      { input: eyebrow.buf, left: X, top: 290 },
      { input: title.buf, left: X - 4, top: 324 },
      { input: slogan.buf, left: X, top: 476 },
      { input: factsDim, left: X, top: 586 - facts.h },
    ])
    .png({ compressionLevel: 9 }).toFile(path.join(ROOT, "..", "..", "app", "opengraph-image.png"));
  console.log("written app/opengraph-image.png");
})().catch((e) => { console.error(e); process.exit(1); });

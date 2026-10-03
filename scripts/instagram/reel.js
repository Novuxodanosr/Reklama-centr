// Ролик-манифест 1080×1920 (Reels): заставка → 4 сцены из роликов сайта с крупными словами → финал с контактами.
// Звука нет: музыку удобнее выбрать из библиотеки Instagram при публикации (так ролик лучше продвигается).
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const FONT = path.join(__dirname, "sofia.ttf");
const FAMILY = "Sofia Sans Extra Condensed ExtraBold";
const INK = "#0B0B0D", PAPER = "#F5F4F0", RED = "#E4142F";
const W = 1080, H = 1920;
const TMP = path.join(__dirname, "reel");
fs.mkdirSync(TMP, { recursive: true });
const VID = "D:/САЙТ/RC/public/video";

const logoPaths = fs.readFileSync("D:/САЙТ/RC/components/Logo.tsx", "utf8").match(/<path [^>]*\/>/g).join("");
const logo = (w) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 503.2 135.25" width="${w}" height="${Math.round((w * 135.25) / 503.2)}"><g fill="${PAPER}">${logoPaths}</g></svg>`);
async function text(markup, px) {
  const b = await sharp({ text: { text: markup, font: `${FAMILY}, ${px}`, fontfile: FONT, rgba: true, dpi: 72, align: "center" } }).png().toBuffer();
  const t = await sharp(b).trim({ threshold: 1 }).png().toBuffer();
  const m = await sharp(t).metadata();
  return { input: t, w: m.width, h: m.height };
}
const center = (b, top) => ({ input: b.input, left: Math.round((W - b.w) / 2), top: Math.round(top) });

async function card(file, items) {
  const layers = [{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><radialGradient id="r" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stop-color="${RED}" stop-opacity="0.28"/><stop offset="1" stop-color="${RED}" stop-opacity="0"/></radialGradient><rect width="${W}" height="${H}" fill="url(#r)"/></svg>`), left: 0, top: 0 }, ...items];
  await sharp({ create: { width: W, height: H, channels: 3, background: INK } }).composite(layers).png().toFile(file);
}
// Крупное слово внизу кадра (в безопасной зоне Reels — выше подписи и кнопок).
async function label(file, word) {
  const t = await text(`<span foreground="${PAPER}">${word}</span>`, 210);
  const bar = { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="140" height="12"><rect width="140" height="12" fill="${RED}"/></svg>`), left: Math.round((W - 140) / 2), top: 1210 };
  const shade = { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="${INK}" stop-opacity="0"/><stop offset="0.8" stop-color="${INK}" stop-opacity="0.75"/></linearGradient><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`), left: 0, top: 0 };
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([shade, bar, center(t, 1250), { input: logo(220), left: Math.round((W - 220) / 2), top: 150 }]).png().toFile(file);
}

(async () => {
  const s1 = await text(`<span foreground="${RED}">WBB</span>`, 330);
  const s2 = await text(`<span foreground="${PAPER}">БУДЕТ</span>`, 190);
  const s3 = await text(`<span foreground="${PAPER}">ЗАБРЕНДИРОВАНО!</span>`, 150);
  await card(`${TMP}/intro.png`, [{ input: logo(380), left: Math.round((W - 380) / 2), top: 300 }, center(s1, 640), center(s2, 1010), center(s3, 1210)]);

  const o1 = await text(`<span foreground="${PAPER}">ВЫВЕСКИ · СТЕНДЫ · POS · МЕРЧ</span>`, 72);
  const o2 = await text(`<span foreground="${RED}">+998 88 000 61 61</span>`, 120);
  const o3 = await text(`<span foreground="${PAPER}">reklama-centr.com</span>`, 72);
  const o4 = await text(`<span foreground="${PAPER}" letter_spacing="4000">ТАШКЕНТ</span>`, 46);
  await card(`${TMP}/outro.png`, [{ input: logo(560), left: Math.round((W - 560) / 2), top: 560 }, center(o1, 860), center(o2, 1000), center(o3, 1160), center(o4, 1280)]);

  const scenes = [
    ["production.mp4", 5.5, 3.2, "МОНТИРУЕМ"],
    ["infinity-story.mp4", 10.0, 3.0, "ЗАЖИГАЕМ"],
    ["infinity-stele.mp4", 0.3, 2.6, "ВЫДЕЛЯЕМ"],
    ["lavazza-point.mp4", 1.0, 2.8, "БРЕНДИРУЕМ"],
  ];
  for (const [i, s] of scenes.entries()) await label(`${TMP}/l${i}.png`, s[3]);

  const args = ["-y", "-loglevel", "error"];
  args.push("-loop", "1", "-t", "2.2", "-i", `${TMP}/intro.png`);
  for (const [f, ss, dur] of scenes) args.push("-ss", String(ss), "-t", String(dur), "-i", `${VID}/${f}`);
  args.push("-loop", "1", "-t", "3", "-i", `${TMP}/outro.png`);
  for (let i = 0; i < scenes.length; i++) args.push("-loop", "1", "-i", `${TMP}/l${i}.png`);

  const n = scenes.length;
  let fc = `[0]scale=${W}:${H},setsar=1,fps=30,format=yuv420p[c0];`;
  for (let i = 0; i < n; i++) {
    const v = i + 1, lab = n + 2 + i;
    fc += `[${v}]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=30,eq=contrast=1.05:saturation=1.08[v${i}];`;
    fc += `[v${i}][${lab}]overlay=0:0:shortest=1,format=yuv420p[c${i + 1}];`;
  }
  fc += `[${n + 1}]scale=${W}:${H},setsar=1,fps=30,format=yuv420p[c${n + 1}];`;
  fc += Array.from({ length: n + 2 }, (_, i) => `[c${i}]`).join("") + `concat=n=${n + 2}:v=1:a=0[out]`;
  args.push("-filter_complex", fc, "-map", "[out]", "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "D:/САЙТ/Instagram/reel-manifest.mp4");
  execFileSync("ffmpeg", args, { stdio: "inherit" });
  // Обложка ролика для сетки — заставка.
  fs.copyFileSync(`${TMP}/intro.png`, "D:/САЙТ/Instagram/reel-manifest-cover.png");
  console.log("ok");
})().catch((e) => { console.error(e); process.exit(1); });

// Сборка data/catalog.json из разобранного прайса поставщика (scratchpad/pb) и переводов (tr-out-*.json).
// Запуск: node scripts/catalog/build-catalog.mjs <папка pb>
// Себестоимость (costUsd) и упаковка остаются только в data/catalog.json и admin — на публичный сайт не попадают.
import fs from "node:fs";
import path from "node:path";

const src = process.argv[2];
if (!src) throw new Error("Укажи папку с catalog-src.json");
const root = process.cwd();
const items = JSON.parse(fs.readFileSync(path.join(src, "catalog-src.json"), "utf8"));
const tr = {};
for (const f of fs.readdirSync(src).filter((f) => /^tr-out-\d+\.json$/.test(f))) {
  for (const t of JSON.parse(fs.readFileSync(path.join(src, f), "utf8"))) tr[t.id] = t;
}

// Словарь характеристик: ключ из прайса → подпись на трёх языках.
const K = {
  "real capacity": ["Реальная ёмкость", "Real capacity", "Haqiqiy sig‘im"],
  capacity: ["Ёмкость", "Capacity", "Sig‘im"],
  "battery type": ["Тип аккумулятора", "Battery type", "Batareya turi"],
  "case material": ["Материал корпуса", "Case material", "Korpus materiali"],
  material: ["Материал", "Material", "Material"],
  "product size": ["Размер", "Size", "O‘lchami"],
  size: ["Размер", "Size", "O‘lchami"],
  "net weight": ["Вес", "Net weight", "Og‘irligi"],
  "gross weight": ["Вес с упаковкой", "Gross weight", "Qadoq bilan og‘irligi"],
  weight: ["Вес", "Weight", "Og‘irligi"],
  color: ["Цвета", "Colours", "Ranglar"],
  "usb-c input": ["Вход USB-C", "USB-C input", "USB-C kirish"],
  "type-c input": ["Вход USB-C", "USB-C input", "USB-C kirish"],
  "- c input": ["Вход USB-C", "USB-C input", "USB-C kirish"],
  "micro input": ["Вход Micro-USB", "Micro-USB input", "Micro-USB kirish"],
  "micro&type-c input": ["Вход Micro-USB / USB-C", "Micro-USB / USB-C input", "Micro-USB / USB-C kirish"],
  "lightning input": ["Вход Lightning", "Lightning input", "Lightning kirish"],
  input: ["Вход", "Input", "Kirish"],
  "usb-c output": ["Выход USB-C", "USB-C output", "USB-C chiqish"],
  "type-c output": ["Выход USB-C", "USB-C output", "USB-C chiqish"],
  "usb-c port output": ["Выход USB-C", "USB-C output", "USB-C chiqish"],
  "usb-a output": ["Выход USB-A", "USB-A output", "USB-A chiqish"],
  "usb output": ["Выход USB", "USB output", "USB chiqish"],
  output: ["Выход", "Output", "Chiqish"],
  "usb-c cable output": ["Выход встроенного кабеля USB-C", "Built-in USB-C cable output", "O‘rnatilgan USB-C kabel chiqishi"],
  "usb-a cable input": ["Вход встроенного кабеля USB-A", "Built-in USB-A cable input", "O‘rnatilgan USB-A kabel kirishi"],
  "lightning cable output": ["Выход встроенного кабеля Lightning", "Built-in Lightning cable output", "O‘rnatilgan Lightning kabel chiqishi"],
  "wireless output": ["Беспроводной выход", "Wireless output", "Simsiz chiqish"],
  "magnetic wireless output": ["Магнитный беспроводной выход", "Magnetic wireless output", "Magnitli simsiz chiqish"],
  "watch output": ["Выход для часов", "Watch output", "Soat uchun chiqish"],
  "earbuds output": ["Выход для наушников", "Earbuds output", "Quloqchin uchun chiqish"],
  "earphones output": ["Выход для наушников", "Earbuds output", "Quloqchin uchun chiqish"],
  "charging distance": ["Дистанция зарядки", "Charging distance", "Zaryadlash masofasi"],
  "charge efficiency": ["КПД зарядки", "Charge efficiency", "Zaryadlash samaradorligi"],
  "working frequency": ["Рабочая частота", "Working frequency", "Ish chastotasi"],
  "charging cable length": ["Длина кабеля", "Cable length", "Kabel uzunligi"],
  "charging cable": ["Кабель", "Cable", "Kabel"],
  type: ["Тип", "Type", "Turi"],
  "solar panel": ["Солнечная панель", "Solar panel", "Quyosh paneli"],
  "led light": ["Фонарь", "LED light", "Fonar"],
  "charging time": ["Время зарядки", "Charging time", "Zaryadlash vaqti"],
  "ac input": ["Вход AC", "AC input", "AC kirish"],
  "ac output": ["Выход AC", "AC output", "AC chiqish"],
  "dc output": ["Выход DC", "DC output", "DC chiqish"],
  "battery capacity": ["Ёмкость аккумулятора", "Battery capacity", "Batareya sig‘imi"],
};
// Значения-слова (цвета, материалы, типы батарей).
const V = {
  black: ["чёрный", "black", "qora"], white: ["белый", "white", "oq"], grey: ["серый", "grey", "kulrang"], gray: ["серый", "grey", "kulrang"],
  orange: ["оранжевый", "orange", "to‘q sariq"], blue: ["синий", "blue", "ko‘k"], green: ["зелёный", "green", "yashil"], red: ["красный", "red", "qizil"],
  pink: ["розовый", "pink", "pushti"], purple: ["фиолетовый", "purple", "binafsha"], yellow: ["жёлтый", "yellow", "sariq"], silver: ["серебристый", "silver", "kumushrang"],
  gold: ["золотистый", "gold", "oltinrang"], navy: ["тёмно-синий", "navy", "to‘q ko‘k"], "dark blue": ["тёмно-синий", "dark blue", "to‘q ko‘k"],
  "light blue": ["голубой", "light blue", "havorang"], "dark green": ["тёмно-зелёный", "dark green", "to‘q yashil"], brown: ["коричневый", "brown", "jigarrang"],
  transparent: ["прозрачный", "transparent", "shaffof"], beige: ["бежевый", "beige", "bej"], "rose gold": ["розовое золото", "rose gold", "pushti oltin"],
  abs: ["ABS-пластик", "ABS", "ABS-plastik"], "abs+pc": ["ABS + поликарбонат", "ABS + PC", "ABS + polikarbonat"], pc: ["поликарбонат", "PC", "polikarbonat"],
  "aluminum+pc": ["алюминий + поликарбонат", "aluminium + PC", "alyuminiy + polikarbonat"], aluminum: ["алюминий", "aluminium", "alyuminiy"],
  "aluminum alloy": ["алюминиевый сплав", "aluminium alloy", "alyuminiy qotishmasi"], "aluminium alloy": ["алюминиевый сплав", "aluminium alloy", "alyuminiy qotishmasi"],
  "pc+abs": ["поликарбонат + ABS", "PC + ABS", "polikarbonat + ABS"], silicone: ["силикон", "silicone", "silikon"], "pu leather": ["экокожа", "PU leather", "ekoteri"],
  "li-polymer": ["литий-полимерный", "Li-polymer", "litiy-polimer"], "li-polymer battery": ["литий-полимерный", "Li-polymer", "litiy-polimer"],
  "polymer battery": ["литий-полимерный", "Li-polymer", "litiy-polimer"], "lithium polymer": ["литий-полимерный", "Li-polymer", "litiy-polimer"],
  "li-ion": ["литий-ионный", "Li-ion", "litiy-ion"], "18650": ["Li-ion 18650", "Li-ion 18650", "Li-ion 18650"], "21700": ["Li-ion 21700", "Li-ion 21700", "Li-ion 21700"],
};
const tv = (v) => {
  const parts = v.split(/\s*[,，、/]\s*/).map((s) => s.trim()).filter(Boolean);
  const hit = parts.map((p) => V[p.toLowerCase()]);
  if (hit.every(Boolean)) return { ru: hit.map((h) => h[0]).join(", "), en: hit.map((h) => h[1]).join(", "), uz: hit.map((h) => h[2]).join(", ") };
  return v;
};
const tk = (k) => {
  const key = k.toLowerCase().replace(/\s+/g, " ").trim();
  const hit = K[key] || K[key.replace(/^type /, "type-")];
  return hit ? { ru: hit[0], en: hit[1], uz: hit[2] } : { ru: k, en: k, uz: k };
};
const INCL = {
  "wireless charger": ["беспроводная зарядка", "wireless charger", "simsiz zaryadlovchi"],
  "power bank": ["повербанк", "power bank", "pauerbank"],
  "usb a to c cable": ["кабель USB-A – USB-C", "USB-A to USB-C cable", "USB-A – USB-C kabeli"],
  "usb c to c cable": ["кабель USB-C – USB-C", "USB-C to USB-C cable", "USB-C – USB-C kabeli"],
  "type-c cable": ["кабель USB-C", "USB-C cable", "USB-C kabeli"],
  "standard box": ["коробка", "box", "quti"],
  "user manual": ["инструкция", "user manual", "qo‘llanma"],
  "c-c cable": ["кабель USB-C – USB-C", "USB-C to USB-C cable", "USB-C – USB-C kabeli"],
  "a-c cable": ["кабель USB-A – USB-C", "USB-A to USB-C cable", "USB-A – USB-C kabeli"],
};
const ti = (s) => {
  const m = s.match(/^(\d+)\s*x\s*(.+)$/i);
  if (!m) return { ru: s, en: s, uz: s };
  const hit = INCL[m[2].toLowerCase().trim()];
  return hit ? { ru: `${m[1]} × ${hit[0]}`, en: `${m[1]} × ${hit[1]}`, uz: `${m[1]} × ${hit[2]}` } : { ru: s, en: s, uz: s };
};

const T = (ru, en, uz) => ({ ru, en, uz });
const categories = [
  { id: "outdoor", parent: null, title: T("Наружная реклама", "Outdoor advertising", "Tashqi reklama"), order: 1 },
  { id: "print", parent: null, title: T("Полиграфия", "Print", "Poligrafiya"), order: 2 },
  { id: "souvenirs", parent: null, title: T("Сувенирная продукция", "Promotional products", "Suvenir mahsulotlari"), order: 3 },
  { id: "wide-format-print", parent: "outdoor", title: T("Широкоформатная печать", "Large-format printing", "Keng formatli bosma"), order: 1 },
  { id: "volumetric-letters", parent: "outdoor", title: T("Объёмные буквы", "Channel letters", "Hajmli harflar"), order: 2 },
  { id: "lightboxes", parent: "outdoor", title: T("Световые короба", "Lightboxes", "Yorug‘lik qutilari"), order: 3 },
  { id: "business-cards", parent: "print", title: T("Визитки", "Business cards", "Vizitkalar"), order: 1 },
  { id: "flyers", parent: "print", title: T("Листовки и флаеры", "Flyers", "Flayerlar"), order: 2 },
  { id: "notepads", parent: "print", title: T("Блокноты", "Notepads", "Bloknotlar"), order: 3 },
  { id: "stickers", parent: "print", title: T("Наклейки", "Stickers", "Stikerlar"), order: 4 },
  { id: "wireless-chargers", parent: "souvenirs", title: T("Беспроводные зарядки", "Wireless chargers", "Simsiz zaryadlovchilar"), order: 1 },
  { id: "magsafe-power-banks", parent: "souvenirs", title: T("Магнитные повербанки", "Magnetic power banks", "Magnitli pauerbanklar"), order: 2 },
  { id: "pd-power-banks", parent: "souvenirs", title: T("Повербанки с быстрой зарядкой", "Fast-charging power banks", "Tez zaryadlovchi pauerbanklar"), order: 3 },
  { id: "capsule-power-banks", parent: "souvenirs", title: T("Компактные повербанки", "Compact power banks", "Ixcham pauerbanklar"), order: 4 },
  { id: "regular-power-banks", parent: "souvenirs", title: T("Классические повербанки", "Classic power banks", "Klassik pauerbanklar"), order: 5 },
  { id: "solar-power-banks", parent: "souvenirs", title: T("Повербанки на солнечных батареях", "Solar power banks", "Quyosh batareyali pauerbanklar"), order: 6 },
  { id: "laptop-power-banks", parent: "souvenirs", title: T("Повербанки для ноутбуков", "Laptop power banks", "Noutbuk uchun pauerbanklar"), order: 7 },
  { id: "statuettes", parent: "souvenirs", title: T("Статуэтки и награды", "Statuettes and awards", "Haykalchalar va mukofotlar"), order: 8 },
];

const imgDir = path.join(root, "public/catalog");
fs.mkdirSync(imgDir, { recursive: true });
let missingTr = 0;
const products = items.map((p, i) => {
  const t = tr[p.id];
  if (!t) missingTr++;
  const images = [];
  [...p.photos, ...p.packPhotos].forEach((name, n) => {
    const from = path.join(src, "img", `${name}.webp`);
    if (!fs.existsSync(from)) return;
    const file = `${p.id}-${n + 1}.webp`;
    fs.copyFileSync(from, path.join(imgDir, file));
    images.push(`/catalog/${file}`);
  });
  return {
    id: p.id,
    category: p.section,
    codes: p.codes,
    title: t?.title ?? { ru: p.name_en, en: p.name_en, uz: p.name_en },
    short: t?.short ?? { ru: "", en: "", uz: "" },
    features: t?.features ?? { ru: p.features_en, en: p.features_en, uz: p.features_en },
    specs: p.specs.map((s) => ({ k: tk(s.k), v: tv(s.v) })),
    included: p.included.map(ti),
    images,
    unit: "pcs",
    costUsd: p.usdFrom,
    markup: null,
    price: null,
    published: true,
    order: i + 1,
  };
});

const catalog = {
  settings: { showPrices: true, currency: "usd", usdRate: 12300, markupMode: "pct", markupValue: 30, priceStep: 0.5, minQty: 50 },
  categories,
  products,
};
fs.mkdirSync(path.join(root, "data"), { recursive: true });
fs.writeFileSync(path.join(root, "data/catalog.json"), JSON.stringify(catalog, null, 1));
console.log(`catalog: ${products.length} товаров, ${products.reduce((s, p) => s + p.images.length, 0)} фото, без перевода: ${missingTr}`);

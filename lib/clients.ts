// Логотипы клиентов группы компаний. Файлы — public/clients/<id>.webp.
// Чтобы добавить клиента: положить логотип (прозрачный фон) в public/clients/ и дописать строку.
export type Client = { id: string; name: string };

export const clients: Client[] = [
  { id: "akfa", name: "AKFA" },
  { id: "alfa-bank", name: "Alfa-Bank" },
  { id: "anorbank", name: "ANORBANK" },
  { id: "bellissimo", name: "Bellissimo Pizza" },
  { id: "balton", name: "Balton Trading Asia" },
  { id: "emu", name: "EMU" },
  { id: "golden-house", name: "Golden House" },
  { id: "haribo", name: "Haribo" },
  { id: "ice-city", name: "Ice City" },
  { id: "ipoteka-bank", name: "Ipoteka Bank — OTP Group" },
  { id: "it-park", name: "IT Park" },
  { id: "josera", name: "Josera" },
  { id: "li-ning", name: "Li-Ning" },
  { id: "motul", name: "Motul" },
  { id: "octobank", name: "Octobank" },
  { id: "oqtepa-lavash", name: "Oqtepa Lavash" },
  { id: "paynet", name: "PAYNET" },
  { id: "sofia", name: "Sofia café & bakery" },
  { id: "sugurta", name: "Sug'urta to'lovlarini kafolatlash jamg'armasi" },
  { id: "teamavia", name: "Teamavia" },
  { id: "theonealma", name: "TheOneAlma aesthetic" },
  { id: "tmz", name: "Toshkent Metallurgiya Zavodi" },
  { id: "tourism-academy", name: "Tourism Service Academy" },
  { id: "ucell", name: "Ucell" },
  { id: "uzum", name: "Uzum" },
  { id: "uet", name: "UET Construction" },
  { id: "yandex-go", name: "Yandex Go" },
  { id: "zarqand", name: "Zarqand" },
];

export const clientImage = (id: string) => `/clients/${id}.webp`;

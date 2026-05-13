// Images live in /public/assets/ so they have stable URL paths and can be
// stored in D1 (which can't reference bundled-import URLs).
const svcHaircut = "/assets/svc-manicure.jpg";
const svcBeard = "/assets/svc-pedicure.jpg";
const svcShave = "/assets/svc-lashes.jpg";
const svcKids = "/assets/svc-brows.jpg";
const svcColoring = "/assets/svc-skincare.jpg";
const svcStyling = "/assets/svc-hair.jpg";
const master1 = "/assets/master-1.jpg";
const master2 = "/assets/master-2.jpg";
const master3 = "/assets/master-3.jpg";
const branch1 = "/assets/branch-1.jpg";

export type CategoryId =
  | "all"
  | "haircut"
  | "beard"
  | "shave"
  | "kids"
  | "coloring"
  | "styling"
  | "combo";

export interface Category {
  id: CategoryId;
  label: string;
}

export interface Service {
  id: string;
  category: Exclude<CategoryId, "all">;
  title: string;
  durationMin: number;
  price: number; // sum
  image: string;
  description: string;
  popular?: boolean;
}

export interface Master {
  id: string;
  name: string;
  role: string;
  image: string;
  rating: number;
  yearsExp: number;
  serviceIds: string[];
  branchIds: string[];
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  image: string;
  distanceKm: number;
}

export interface Promo {
  id: string;
  title: string;
  description: string;
  badge: string;
  validUntil: string;
  image: string;
}

export interface Booking {
  id: string;
  serviceTitle: string;
  masterName: string;
  branchName: string;
  startAt: string; // ISO
  durationMin: number;
  price: number;
  status: "upcoming" | "completed" | "cancelled";
  // Telegram user id of the customer who made this booking (optional for
  // legacy/mock entries). When set, /profile filters bookings by the current
  // Telegram user.
  tgUserId?: number;
  customerName?: string;
}

export const categories: Category[] = [
  { id: "all", label: "Все" },
  { id: "haircut", label: "Стрижка" },
  { id: "beard", label: "Борода" },
  { id: "shave", label: "Бритьё" },
  { id: "kids", label: "Детская" },
  { id: "coloring", label: "Камуфляж" },
  { id: "styling", label: "Укладка" },
  { id: "combo", label: "Комбо" },
];

export const services: Service[] = [
  {
    id: "s1",
    category: "haircut",
    title: "Классическая мужская стрижка",
    durationMin: 45,
    price: 150000,
    image: svcHaircut,
    description: "Стрижка машинкой и ножницами, мытьё головы, укладка и финиш-стайлинг.",
    popular: true,
  },
  {
    id: "s2",
    category: "haircut",
    title: "Фейд / Андеркат",
    durationMin: 60,
    price: 200000,
    image: svcHaircut,
    description: "Чёткий переход (skin / low / mid / high fade) от опытного барбера.",
    popular: true,
  },
  {
    id: "s3",
    category: "beard",
    title: "Моделирование бороды",
    durationMin: 45,
    price: 120000,
    image: svcBeard,
    description: "Стрижка контура, окантовка опасной бритвой, горячий компресс и масло.",
    popular: true,
  },
  {
    id: "s4",
    category: "shave",
    title: "Королевское бритьё",
    durationMin: 60,
    price: 180000,
    image: svcShave,
    description: "Бритьё опасной бритвой, два полотенца, премиальные масла и афтершейв.",
    popular: true,
  },
  {
    id: "s5",
    category: "kids",
    title: "Детская стрижка (до 12 лет)",
    durationMin: 40,
    price: 100000,
    image: svcKids,
    description: "Аккуратная стрижка для маленьких джентльменов в дружелюбной атмосфере.",
  },
  {
    id: "s6",
    category: "coloring",
    title: "Камуфляж седины",
    durationMin: 45,
    price: 160000,
    image: svcColoring,
    description: "Закрашивание седых волос профессиональной мужской краской без аммиака.",
  },
  {
    id: "s7",
    category: "styling",
    title: "Укладка / Стайлинг",
    durationMin: 30,
    price: 80000,
    image: svcStyling,
    description: "Мытьё, сушка и укладка профессиональной мужской косметикой.",
  },
  {
    id: "s8",
    category: "combo",
    title: "Стрижка + Борода",
    durationMin: 90,
    price: 250000,
    image: svcHaircut,
    description: "Комплекс: мужская стрижка и моделирование бороды по выгодной цене.",
    popular: true,
  },
];

export const masters: Master[] = [
  {
    id: "m1",
    name: "Тимур К.",
    role: "Топ-барбер",
    image: master1,
    rating: 4.9,
    yearsExp: 8,
    serviceIds: ["s1", "s2", "s8"],
    branchIds: ["b1", "b2"],
  },
  {
    id: "m2",
    name: "Бекзод А.",
    role: "Барбер · мастер бороды",
    image: master2,
    rating: 5.0,
    yearsExp: 6,
    serviceIds: ["s3", "s4", "s8"],
    branchIds: ["b1", "b3"],
  },
  {
    id: "m3",
    name: "Алишер Р.",
    role: "Барбер · стилист",
    image: master3,
    rating: 4.8,
    yearsExp: 10,
    serviceIds: ["s2", "s5", "s6", "s7"],
    branchIds: ["b2", "b3"],
  },
];

export const branches: Branch[] = [
  {
    id: "b1",
    name: "Bravo Yunusobod",
    address: "ул. Амира Темура, 12",
    phone: "+998 71 200 12 34",
    hours: "Пн–Вс · 09:00–22:00",
    image: branch1,
    distanceKm: 1.4,
  },
  {
    id: "b2",
    name: "Bravo Mirabad",
    address: "ул. Шота Руставели, 78",
    phone: "+998 71 200 12 35",
    hours: "Пн–Вс · 10:00–22:00",
    image: branch1,
    distanceKm: 4.2,
  },
  {
    id: "b3",
    name: "Bravo Chilonzor",
    address: "пр. Бунёдкор, 24",
    phone: "+998 71 200 12 36",
    hours: "Пн–Вс · 09:00–21:00",
    image: branch1,
    distanceKm: 6.8,
  },
];

const promo1 = "/assets/promo-1.jpg";
const promo2 = "/assets/promo-2.jpg";

export const promos: Promo[] = [
  {
    id: "p1",
    title: "Стрижка + Борода −20%",
    description: "Только для новых клиентов Bravo Barbershop.",
    badge: "−20%",
    validUntil: "до 30 ноября",
    image: promo1,
  },
  {
    id: "p2",
    title: "Королевское бритьё −15%",
    description: "Первые 3 визита со скидкой при онлайн-записи.",
    badge: "Новинка",
    validUntil: "до 15 декабря",
    image: promo2,
  },
  {
    id: "p3",
    title: "Детская стрижка в подарок",
    description: "При записи папы на стрижку + бороду в декабре.",
    badge: "Подарок",
    validUntil: "до 31 декабря",
    image: promo1,
  },
];

// Stable ISO strings (avoid Date.now() at module scope — would cause SSR/client hydration mismatch)
export const myBookings: Booking[] = [
  {
    id: "bk1",
    serviceTitle: "Классическая мужская стрижка",
    masterName: "Тимур К.",
    branchName: "Bravo Yunusobod",
    startAt: "2026-05-20T11:00:00.000Z",
    durationMin: 45,
    price: 150000,
    status: "upcoming",
  },
  {
    id: "bk2",
    serviceTitle: "Моделирование бороды",
    masterName: "Бекзод А.",
    branchName: "Bravo Mirabad",
    startAt: "2026-04-28T09:30:00.000Z",
    durationMin: 45,
    price: 120000,
    status: "completed",
  },
];

export const myPromoCodes = [
  { code: "BIRTHDAY-25", title: "Скидка 25% в день рождения", expires: "до 12.06" },
  { code: "FRIEND-100K", title: "100 000 сум за приглашённого друга", expires: "бессрочно" },
];

export function formatSum(sum: number) {
  return sum.toLocaleString("ru-RU") + " сум";
}

export function formatDuration(min: number) {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

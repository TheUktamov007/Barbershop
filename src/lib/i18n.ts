import { useLang, type Lang } from "./lang";

// Translation keys. Add new ones as you wire up i18n in more components.
const dict = {
  // Common
  "common.all": { ru: "Все", uz: "Hammasi" },
  "common.continue": { ru: "Продолжить", uz: "Davom etish" },
  "common.cancel": { ru: "Отменить", uz: "Bekor qilish" },
  "common.save": { ru: "Сохранить", uz: "Saqlash" },
  "common.delete": { ru: "Удалить", uz: "O'chirish" },
  "common.confirm": { ru: "Подтвердить", uz: "Tasdiqlash" },
  "common.back": { ru: "Назад", uz: "Ortga" },
  "common.loading": { ru: "Загружаем…", uz: "Yuklanmoqda…" },
  "common.copy": { ru: "Скопировать", uz: "Nusxalash" },
  "common.copied": { ru: "Скопировано", uz: "Nusxalandi" },
  "common.minutes_short": { ru: "мин", uz: "daq" },
  "common.hour_short": { ru: "ч", uz: "soat" },
  "common.sum": { ru: "сум", uz: "so'm" },

  // BottomNav
  "nav.home": { ru: "Главная", uz: "Asosiy" },
  "nav.services": { ru: "Услуги", uz: "Xizmatlar" },
  "nav.booking": { ru: "Бронировать", uz: "Bron qilish" },
  "nav.profile": { ru: "Профиль", uz: "Profil" },

  // Home
  "home.hero.title": { ru: "Запишитесь онлайн", uz: "Onlayn yoziling" },
  "home.popular": { ru: "Популярные", uz: "Mashhur" },
  "home.popular.suffix": { ru: "услуги", uz: "xizmatlar" },
  "home.all_link": { ru: "Все →", uz: "Hammasi →" },
  "home.trending": { ru: "Сейчас в", uz: "Hozir" },
  "home.trending.suffix": { ru: "тренде", uz: "trendda" },
  "home.promos_link": { ru: "Акции →", uz: "Aksiyalar →" },
  "home.nearest_branch": { ru: "Ближайший филиал", uz: "Eng yaqin filial" },
  "home.route": { ru: "Маршрут", uz: "Yo'l" },
  "home.empty_services": { ru: "Услуги скоро появятся.", uz: "Xizmatlar tez orada paydo bo'ladi." },

  // Services
  "services.catalog": { ru: "Каталог", uz: "Katalog" },
  "services.title": { ru: "Услуги", uz: "Xizmatlar" },
  "services.title.suffix": { ru: "барбершопа", uz: "barbershop" },
  "services.search": { ru: "Поиск услуги", uz: "Xizmat qidirish" },
  "services.empty": { ru: "Ничего не нашли. Попробуйте другой запрос.", uz: "Hech narsa topilmadi." },

  // Categories
  "cat.haircut": { ru: "Стрижка", uz: "Soch olish" },
  "cat.beard": { ru: "Борода", uz: "Soqol" },
  "cat.shave": { ru: "Бритьё", uz: "Qirish" },
  "cat.kids": { ru: "Детская", uz: "Bolalar" },
  "cat.coloring": { ru: "Камуфляж", uz: "Bo'yash" },
  "cat.styling": { ru: "Укладка", uz: "Styling" },
  "cat.combo": { ru: "Комбо", uz: "Kombo" },

  // Booking
  "booking.step_of": { ru: "Шаг {n} из {total}", uz: "Bosqich {n} / {total}" },
  "booking.step.branch": { ru: "Филиал", uz: "Filial" },
  "booking.step.service": { ru: "Услуги", uz: "Xizmatlar" },
  "booking.step.master": { ru: "Мастер", uz: "Usta" },
  "booking.step.datetime": { ru: "Дата и время", uz: "Sana va vaqt" },
  "booking.step.confirm": { ru: "Подтверждение", uz: "Tasdiqlash" },
  "booking.step.done": { ru: "Готово", uz: "Tayyor" },
  "booking.any_master": { ru: "Любой свободный", uz: "Har qanday bo'sh usta" },
  "booking.use_bonus": { ru: "Использовать бонусы", uz: "Bonuslarni ishlatish" },
  "booking.total": { ru: "Итого", uz: "Jami" },
  "booking.pay_at_salon": {
    ru: "Оплата в барбершопе. Отмена бесплатна за 24 часа.",
    uz: "To'lov barbershopda. Bekor qilish 24 soat oldin bepul.",
  },
  "booking.success.title": { ru: "Запись принята", uz: "Yozuv qabul qilindi" },
  "booking.success.subtitle": {
    ru: "Подтверждение и напоминание придут в Telegram. Будем ждать!",
    uz: "Tasdiq va eslatma Telegramga keladi. Kutamiz!",
  },

  // Profile
  "profile.account": { ru: "Личный кабинет", uz: "Shaxsiy kabinet" },
  "profile.upcoming": { ru: "Предстоящие", uz: "Yaqinlashayotgan" },
  "profile.upcoming.suffix": { ru: "записи", uz: "yozuvlar" },
  "profile.history": { ru: "История", uz: "Tarix" },
  "profile.my_promos": { ru: "Мои промокоды", uz: "Mening promokodlar" },
  "profile.tap_to_copy": { ru: "Тапни, чтобы скопировать код", uz: "Kodni nusxalash uchun bosing" },
  "profile.reschedule": { ru: "Перенести", uz: "Ko'chirish" },
  "profile.cancel": { ru: "Отменить", uz: "Bekor qilish" },
  "profile.cashback": { ru: "Кешбэк", uz: "Keshbek" },
  "profile.level": { ru: "Уровень", uz: "Daraja" },
  "profile.visits": { ru: "Визитов", uz: "Tashriflar" },
  "profile.spent": { ru: "Потрачено", uz: "Sarflangan" },
  "profile.bonus_points": { ru: "бонусов", uz: "bonus" },

  // Settings
  "settings.title": { ru: "Настройки", uz: "Sozlamalar" },
  "settings.subtitle": { ru: "Язык интерфейса и параметры аккаунта.", uz: "Interfeys tili va hisob sozlamalari." },
  "settings.language": { ru: "Язык", uz: "Til" },
  "settings.birthday": { ru: "День рождения", uz: "Tug'ilgan kun" },
  "settings.birthday.hint": {
    ru: "В свой день рождения получите скидку 25% на любую услугу.",
    uz: "Tug'ilgan kuningizda har qanday xizmatga 25% chegirma oling.",
  },
  "settings.saved": { ru: "Сохранено ✓", uz: "Saqlandi ✓" },
  "settings.close_app": { ru: "Закрыть Mini App", uz: "Mini App ni yopish" },

  // Reviews
  "review.leave": { ru: "Оставить отзыв", uz: "Sharh qoldirish" },
  "review.your": { ru: "Ваш отзыв", uz: "Sizning sharhingiz" },
  "review.placeholder": { ru: "Расскажите о визите…", uz: "Tashrif haqida yozing…" },
  "review.submit": { ru: "Отправить отзыв", uz: "Sharhni yuborish" },
  "review.rating_required": { ru: "Выберите оценку", uz: "Bahoni tanlang" },
  "review.thanks": { ru: "Спасибо за отзыв!", uz: "Sharhingiz uchun rahmat!" },

  // Profile statuses
  "status.upcoming": { ru: "Скоро", uz: "Tez orada" },
  "status.confirmed": { ru: "Подтверждено", uz: "Tasdiqlangan" },
  "status.completed": { ru: "Прошло", uz: "Yakunlangan" },
  "status.cancelled": { ru: "Отменено", uz: "Bekor qilingan" },

  // Profile sections
  "profile.promocodes": { ru: "Промокоды", uz: "Promokodlar" },
  "profile.promo_active": { ru: "активных", uz: "faol" },
  "profile.certificates": { ru: "Сертификаты", uz: "Sertifikatlar" },
  "profile.certificates.sub": { ru: "Подарок близким", uz: "Yaqinlaringizga sovg'a" },
  "profile.favorites": { ru: "Любимые", uz: "Sevimlilar" },
  "profile.favorites.sub": { ru: "мастера", uz: "ustalar" },
  "profile.club": { ru: "Bravo Club", uz: "Bravo Club" },
  "profile.club.sub": { ru: "Привилегии", uz: "Imtiyozlar" },
  "profile.empty_upcoming": { ru: "Записей пока нет — самое время записаться", uz: "Hozircha yozuvlar yo'q — yozilish vaqti" },
  "profile.login_via_tg": { ru: "Войдите через Telegram", uz: "Telegram orqali kiring" },

  // Booking confirm
  "booking.phone": { ru: "Номер телефона", uz: "Telefon raqami" },
  "booking.phone.hint_new": {
    ru: "Сохраним в профиле для будущих записей.",
    uz: "Keyingi yozuvlar uchun profilda saqlaymiz.",
  },
  "booking.phone.hint_saved": {
    ru: "Сохранён в профиле. Можно изменить.",
    uz: "Profilda saqlangan. O'zgartirish mumkin.",
  },
  "booking.bonus.available": { ru: "Доступно", uz: "Mavjud" },
  "booking.bonus.max": { ru: "максимум", uz: "maksimal" },
  "booking.bonus.toggle": { ru: "Использовать бонусы?", uz: "Bonuslarni ishlatish?" },
  "booking.price.label": { ru: "Стоимость", uz: "Narx" },
  "booking.price.bonus": { ru: "Бонусами", uz: "Bonus bilan" },

  // Common buttons
  "btn.book_now": { ru: "Записаться", uz: "Yozilish" },
  "btn.route": { ru: "Маршрут", uz: "Yo'l" },
  "btn.send": { ru: "Отправить", uz: "Yuborish" },
  "btn.book": { ru: "Бронировать", uz: "Bron qilish" },
  "btn.use_promo": { ru: "Воспользоваться", uz: "Foydalanish" },

  // Promos page
  "promos.now": { ru: "Сейчас", uz: "Hozir" },
  "promos.title": { ru: "Актуальные", uz: "Faol" },
  "promos.title.suffix": { ru: "акции", uz: "aksiyalar" },

  // Branches
  "branches.network": { ru: "Сеть Bravo", uz: "Bravo tarmog'i" },
  "branches.title": { ru: "Наши", uz: "Bizning" },
  "branches.title.suffix": { ru: "филиалы", uz: "filiallar" },

  // Service detail
  "service.included": { ru: "Что входит", uz: "Nimalarni o'z ichiga oladi" },
  "service.masters": { ru: "Мастера", uz: "Ustalar" },
  "service.reviews": { ru: "Отзывы клиентов", uz: "Mijozlar sharhlari" },

  // Hero
  "hero.network": { ru: "Сеть барбершопов · Ташкент", uz: "Barbershop tarmog'i · Toshkent" },
  "hero.title.a": { ru: "Подними свой", uz: "O'z stilingizni" },
  "hero.title.b": { ru: "стиль на", uz: "yangi" },
  "hero.title.italic": { ru: "новый", uz: "darajaga" },
  "hero.title.c": { ru: "уровень", uz: "ko'taring" },
  "hero.subtitle": {
    ru: "Премиальные мужские стрижки, опытные барберы и онлайн-запись за минуту.",
    uz: "Premium erkak soch olishlar, tajribali barberlar va bir daqiqada onlayn yozilish.",
  },

  // Categories chip "Все"
  "chip.all": { ru: "Все", uz: "Hammasi" },

  // Admin
  "admin.title": { ru: "Админ-панель", uz: "Admin paneli" },
  "admin.tab.dashboard": { ru: "Дашборд", uz: "Boshqaruv" },
  "admin.tab.bookings": { ru: "Записи", uz: "Bronlar" },
  "admin.tab.branches": { ru: "Филиалы", uz: "Filiallar" },
  "admin.tab.services": { ru: "Услуги", uz: "Xizmatlar" },
  "admin.tab.masters": { ru: "Мастера", uz: "Ustalar" },
  "admin.tab.promos": { ru: "Акции", uz: "Aksiyalar" },
  "admin.reset": { ru: "Сброс", uz: "Tiklash" },
  "admin.today": { ru: "Сегодня", uz: "Bugun" },
  "admin.waiting": { ru: "Ожидают", uz: "Kutmoqda" },
  "admin.confirmed_plural": { ru: "Подтверждено", uz: "Tasdiqlangan" },
  "admin.completed_plural": { ru: "Завершено", uz: "Yakunlangan" },
  "admin.cancelled_plural": { ru: "Отменено", uz: "Bekor qilingan" },
  "admin.total_bookings": { ru: "Всего записей", uz: "Jami bronlar" },
  "admin.revenue": { ru: "Выручка (без отменённых)", uz: "Tushum (bekor qilinmaganlar)" },
  "admin.revenue.completed": { ru: "Завершено", uz: "Yakunlangan" },
  "admin.next_week": { ru: "Ближайшие 7 дней", uz: "Yaqin 7 kun" },
  "admin.master_load": { ru: "Загрузка мастеров", uz: "Ustalar yuklamasi" },

  // Profile — extra keys
  "profile.loading": { ru: "Загружаем…", uz: "Yuklanmoqda…" },
  "profile.no_upcoming": { ru: "Записей пока нет — самое время записаться", uz: "Yozuvlar yo'q — yozilish vaqti keldi" },
  "profile.invite_friend": { ru: "Пригласить друга", uz: "Do'stni taklif qilish" },
  "profile.invite_friend.sub": { ru: "+50 000 бонусов", uz: "+50 000 bonus" },
  "profile.my_calendar": { ru: "Мой календарь", uz: "Mening kalendarim" },
  "profile.my_calendar.sub": { ru: "все визиты", uz: "barcha tashriflar" },
  "profile.write_to_lume": { ru: "Написать в Bravo", uz: "Bravo bilan yozishish" },
  "profile.write_to_lume.sub": { ru: "Вопросы, переносы, пожелания", uz: "Savollar, ko'chirish, istaklar" },
  "profile.my_vouchers": { ru: "Мои ваучеры", uz: "Mening vauchеrlarim" },
  "profile.my_packages": { ru: "Мои абонементы", uz: "Mening abonementlarim" },
  "profile.history_label": { ru: "История визитов", uz: "Tashriflar tarixi" },
  "profile.my_promos_label": { ru: "Мои промокоды", uz: "Mening promokodlar" },
  "profile.apply_at_booking": { ru: "Применить при бронировании →", uz: "Bron qilishda qo'llash →" },
  "profile.tap_copy_hint": { ru: "Тап на код → скопировать. «Применить» → откроется бронирование, код подставится автоматически.", uz: "Kodga teging — nusxalash. «Qo'llash» — bron sahifasi ochiladi, kod avtomatik kiritiladi." },

  // BookingCard
  "card.reschedule": { ru: "Перенести", uz: "Ko'chirish" },
  "card.share": { ru: "↗ Поделиться", uz: "↗ Ulashish" },
  "card.cancel": { ru: "Отменить", uz: "Bekor qilish" },
  "card.repeat": { ru: "↻ Повторить запись", uz: "↻ Yozuvni qaytarish" },
  "card.leave_review": { ru: "★ Оставить отзыв", uz: "★ Sharh qoldirish" },
  "card.thanks_review": { ru: "Спасибо за отзыв ✨", uz: "Sharhingiz uchun rahmat ✨" },

  // Voucher / package labels
  "voucher.code": { ru: "Код", uz: "Kod" },
  "voucher.balance": { ru: "Баланс", uz: "Balans" },
  "voucher.remaining": { ru: "Осталось", uz: "Qoldi" },
  "voucher.until": { ru: "до", uz: "gacha" },
  "voucher.visits": { ru: "визитов", uz: "tashrif" },

  // Push
  "push.title": { ru: "Push-уведомления", uz: "Push bildirishnomalar" },
  "push.desc": {
    ru: "Напоминания и подтверждения будут приходить как обычные уведомления телефона.",
    uz: "Eslatma va tasdiqlar oddiy telefon bildirishnomalari sifatida keladi.",
  },
  "push.enable": { ru: "Включить push", uz: "Push yoqish" },
  "push.disable": { ru: "Отключить push", uz: "Push o'chirish" },
  "push.denied": {
    ru: "Уведомления заблокированы в браузере. Откройте настройки сайта.",
    uz: "Bildirishnomalar brauzerda bloklangan. Sayt sozlamalarini oching.",
  },
  "admin.branches_count": { ru: "Филиалов", uz: "Filiallar" },
  "admin.services_count": { ru: "Услуг", uz: "Xizmatlar" },
  "admin.masters_count": { ru: "Мастеров", uz: "Ustalar" },
  "admin.promos_count": { ru: "Акций", uz: "Aksiyalar" },
} as const;

export type TKey = keyof typeof dict;

export function t(key: TKey, lang: Lang, vars?: Record<string, string | number>): string {
  const entry = dict[key];
  if (!entry) return String(key);
  let s: string = entry[lang] ?? entry.ru ?? String(key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return s;
}

export function useT() {
  const [lang] = useLang();
  return (key: TKey, vars?: Record<string, string | number>) => t(key, lang, vars);
}

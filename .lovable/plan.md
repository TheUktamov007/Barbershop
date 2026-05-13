## Стек (адаптация под Lovable)

Lovable строит фронтенд на **TanStack Start (React 19 + Vite + Tailwind v4)**. Бэкенд = **Lovable Cloud** (Postgres + auth + storage + server functions). Это заменяет связку NestJS+Prisma+Redis+BullMQ из исходного промпта — функциональность та же, инфраструктура встроена.

Telegram WebApp SDK (`@twa-dev/sdk`) подключим — приложение будет работать и как обычный веб, и внутри Telegram (haptics, theme, initData валидация через server function).

i18n (uz/ru/en), Framer Motion, React Hook Form + Zod, TanStack Query — всё ставим.

## Этап 1 (этот раз) — Дизайн-система + главный экран

1. Настроить `src/styles.css`: вся палитра Skinora в oklch-токенах, радиусы, тени с тёплым подтоном.
2. Подключить шрифты: Manrope (sans) + Cormorant Garamond Italic (serif-акцент).
3. Кастомные варианты Shadcn-кнопок: `pill-primary` (айвори фон, тёмный текст), `pill-outline` (прозрачная, белая обводка).
4. Компоненты: `HeroRadial` (радиальное свечение карамель→шоколад), `ServiceCard`, `PromoSlider`, `BottomNav` (mobile-first таб-бар).
5. Главный экран `/`: hero с italic-акцентом в заголовке, две pill-кнопки, слайдер акций, сетка топ-услуг, баннер лояльности.
6. Layout под Telegram: viewport mobile, safe-area, тёмная палитра по умолчанию.

## Этап 2 — Каталог + детальная услуга
Категории, фильтры, поиск, карточка услуги, корзина выбранных услуг.

## Этап 3 — Запись (6-шаговый wizard)
Филиал → услуги → мастер → дата/время → подтверждение → (предоплата опционально). Включить Lovable Cloud, схема БД (branches, services, masters, bookings, master_schedule), server functions со слот-локом.

## Этап 4 — Личный кабинет + auth
Telegram WebApp initData → server function валидирует HMAC → создаёт/находит юзера в Cloud. Мои записи, отмена/перенос, бонусы, промокоды.

## Этап 5 — Лояльность, отзывы, филиалы, акции
Кешбэк-уровни, форма отзыва после визита, страница филиалов с картой, страница акций.

## Что вне scope Lovable
- **Telegram-бот** (Telegraf, команды, рассылки BullMQ) — это отдельный Node-процесс, его нельзя хостить в Lovable. Уведомления можно слать через Telegram Bot API из server function (по cron или webhook), но команды бота `/start`, `/book` и фоновые очереди потребуют внешнего хостинга.
- **Админ-панель** — отдельным Lovable-проектом или доп. маршрутами `/admin/*` позже.
- **Платежи Click/Payme/Uzum** — интегрируем через server functions, когда дойдём до Этапа 3.

## Что построю прямо сейчас (Этап 1)
Дизайн-система + главный экран Mini App. После твоего «ок» иду к каталогу.

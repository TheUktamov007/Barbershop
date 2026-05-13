-- Catalog tables: branches, services, masters, promos.
-- Plus customers (TG user cache) for analytics.

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  hours TEXT NOT NULL,
  image TEXT NOT NULL,
  distance_km REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  price INTEGER NOT NULL,
  image TEXT NOT NULL,
  description TEXT NOT NULL,
  popular INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS masters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  image TEXT NOT NULL,
  rating REAL NOT NULL DEFAULT 5.0,
  years_exp INTEGER NOT NULL DEFAULT 0,
  service_ids TEXT NOT NULL DEFAULT '[]',  -- JSON array
  branch_ids TEXT NOT NULL DEFAULT '[]',   -- JSON array
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS promos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  badge TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  image TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Customer profile cache (refreshed on every initData verification).
CREATE TABLE IF NOT EXISTS customers (
  tg_user_id INTEGER PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  photo_url TEXT,
  language_code TEXT,
  phone TEXT,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  visits_count INTEGER NOT NULL DEFAULT 0,
  birthday TEXT,                          -- YYYY-MM-DD
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Seed data: mirrors src/lib/mock.ts so the app has content out of the box.

INSERT OR IGNORE INTO branches (id, name, address, phone, hours, image, distance_km, sort_order) VALUES
  ('b1', 'Bravo Yunusobod', 'ул. Амира Темура, 12', '+998 71 200 12 34', 'Пн–Вс · 09:00–22:00', '/assets/branch-barbershop.svg', 1.4, 1),
  ('b2', 'Bravo Mirabad', 'ул. Шота Руставели, 78', '+998 71 200 12 35', 'Пн–Вс · 10:00–22:00', '/assets/branch-barbershop.svg', 4.2, 2),
  ('b3', 'Bravo Chilonzor', 'пр. Бунёдкор, 24', '+998 71 200 12 36', 'Пн–Вс · 09:00–21:00', '/assets/branch-barbershop.svg', 6.8, 3);

INSERT OR IGNORE INTO services (id, category, title, duration_min, price, image, description, popular, sort_order) VALUES
  ('s1', 'haircut', 'Классическая мужская стрижка', 45, 150000, '/assets/svc-haircut.svg', 'Стрижка машинкой и ножницами, мытьё головы, укладка и финиш-стайлинг.', 1, 1),
  ('s2', 'haircut', 'Фейд / Андеркат', 60, 200000, '/assets/svc-haircut.svg', 'Чёткий переход (skin / low / mid / high fade) от опытного барбера.', 1, 2),
  ('s3', 'beard', 'Моделирование бороды', 45, 120000, '/assets/svc-beard.svg', 'Стрижка контура, окантовка опасной бритвой, горячий компресс и масло.', 1, 3),
  ('s4', 'shave', 'Королевское бритьё', 60, 180000, '/assets/svc-shave.svg', 'Бритьё опасной бритвой, два полотенца, премиальные масла и афтершейв.', 1, 4),
  ('s5', 'kids', 'Детская стрижка (до 12 лет)', 40, 100000, '/assets/svc-kids.svg', 'Аккуратная стрижка для маленьких джентльменов в дружелюбной атмосфере.', 0, 5),
  ('s6', 'coloring', 'Камуфляж седины', 45, 160000, '/assets/svc-coloring.svg', 'Закрашивание седых волос профессиональной мужской краской без аммиака.', 0, 6),
  ('s7', 'styling', 'Укладка / Стайлинг', 30, 80000, '/assets/svc-styling.svg', 'Мытьё, сушка и укладка профессиональной мужской косметикой.', 0, 7),
  ('s8', 'combo', 'Стрижка + Борода', 90, 250000, '/assets/svc-combo.svg', 'Комплекс: мужская стрижка и моделирование бороды по выгодной цене.', 1, 8);

INSERT OR IGNORE INTO masters (id, name, role, image, rating, years_exp, service_ids, branch_ids) VALUES
  ('m1', 'Тимур К.', 'Топ-барбер', '/assets/master-1.svg', 4.9, 8, '["s1","s2","s8"]', '["b1","b2"]'),
  ('m2', 'Бекзод А.', 'Барбер · мастер бороды', '/assets/master-2.svg', 5.0, 6, '["s3","s4","s8"]', '["b1","b3"]'),
  ('m3', 'Алишер Р.', 'Барбер · стилист', '/assets/master-3.svg', 4.8, 10, '["s2","s5","s6","s7"]', '["b2","b3"]');

INSERT OR IGNORE INTO promos (id, title, description, badge, valid_until, image, sort_order) VALUES
  ('p1', 'Стрижка + Борода −20%', 'Только для новых клиентов Bravo Barbershop.', '−20%', 'до 30 ноября', '/assets/promo-1.svg', 1),
  ('p2', 'Королевское бритьё −15%', 'Первые 3 визита со скидкой при онлайн-записи.', 'Новинка', 'до 15 декабря', '/assets/promo-2.svg', 2),
  ('p3', 'Детская стрижка в подарок', 'При записи папы на стрижку + бороду в декабре.', 'Подарок', 'до 31 декабря', '/assets/promo-1.svg', 3);

-- Slot locks now in D1 (was localStorage). Replaces stale entries via expires_at.
-- (Table already created in 0001 — no-op here if exists.)

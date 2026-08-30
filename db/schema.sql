CREATE TABLE IF NOT EXISTS users (
  kick_user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_url TEXT,
  is_subscriber BOOLEAN DEFAULT FALSE,
  kk_points INTEGER DEFAULT 0,
  sub_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_intervals (
  id SERIAL PRIMARY KEY,
  kick_user_id TEXT NOT NULL,
  interval_bucket BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (kick_user_id, interval_bucket)
);

CREATE TABLE IF NOT EXISTS shop_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Losování',
  price INTEGER NOT NULL,
  img TEXT,
  stock INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  kick_user_id TEXT NOT NULL,
  item_id INTEGER NOT NULL REFERENCES shop_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  img TEXT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id SERIAL PRIMARY KEY,
  kick_user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

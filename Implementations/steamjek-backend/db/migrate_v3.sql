-- ============================================================
-- migrate_v3.sql — Point Shop & Community Hub
-- ============================================================

-- ── POINT SHOP ───────────────────────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS point_rewards (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    image_url   TEXT,
    type        VARCHAR(50)  NOT NULL,          -- 'avatar_frame' | 'badge' | 'banner'
    game_id     INTEGER REFERENCES games(id),   -- NULL = global, set = game-specific
    cost        INTEGER      NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_rewards (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reward_id   INTEGER REFERENCES point_rewards(id) ON DELETE CASCADE,
    is_equipped BOOLEAN   DEFAULT FALSE,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, reward_id)
);

-- ── COMMUNITY HUB ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS threads (
    id          SERIAL PRIMARY KEY,
    game_id     INTEGER REFERENCES games(id) ON DELETE CASCADE,
    user_id     INTEGER REFERENCES users(id),
    title       VARCHAR(255) NOT NULL,
    content     TEXT         NOT NULL,
    tag         VARCHAR(50)  NOT NULL DEFAULT 'Discussion',
    view_count  INTEGER      DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS thread_replies (
    id         SERIAL PRIMARY KEY,
    thread_id  INTEGER REFERENCES threads(id) ON DELETE CASCADE,
    user_id    INTEGER REFERENCES users(id),
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS thread_likes (
    id         SERIAL PRIMARY KEY,
    thread_id  INTEGER REFERENCES threads(id) ON DELETE CASCADE,
    user_id    INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(thread_id, user_id)
);

-- ── DEFAULT SEED DATA ────────────────────────────────────────

INSERT INTO point_rewards (name, description, image_url, type, game_id, cost) VALUES
  ('Neon Cyan Frame',   'A glowing cyan avatar frame',          NULL, 'avatar_frame', NULL, 500),
  ('Violet Halo Frame', 'A sleek violet avatar frame',          NULL, 'avatar_frame', NULL, 750),
  ('Gold Crown Frame',  'Exclusive gold crown avatar frame',    NULL, 'avatar_frame', NULL, 1500),
  ('Rookie Badge',      'You are just getting started!',        NULL, 'badge',        NULL, 200),
  ('Veteran Badge',     'Seasoned gamer badge',                 NULL, 'badge',        NULL, 800),
  ('Legend Badge',      'Top-tier exclusive legend badge',      NULL, 'badge',        NULL, 2000),
  ('Cyberpunk Banner',  'A cyberpunk-styled profile banner',    NULL, 'banner',       NULL, 1000),
  ('Space Banner',      'Deep space aesthetic profile banner',  NULL, 'banner',       NULL, 1200),
  ('Dragon Banner',     'Fiery dragon profile banner',          NULL, 'banner',       NULL, 1800)
ON CONFLICT DO NOTHING;

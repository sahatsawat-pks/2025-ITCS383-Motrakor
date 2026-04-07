-- 1. DROP ALL OLD TABLES TO FIX SCHEMA CONFLICTS
DROP TABLE IF EXISTS thread_likes, thread_replies, threads, user_rewards, point_rewards, market_transactions, market_listings, user_items, item_types, ratings, wishlist, purchases, cart, items, games, users CASCADE;

-- 2. CREATE THE LATEST TABLES (From README Step 4)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  address TEXT,
  credit_card_token VARCHAR(255),
  balance DECIMAL(10,2) DEFAULT 1000.00,
  points INTEGER DEFAULT 0,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  genre VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  age_rating VARCHAR(20),
  creator_id INTEGER REFERENCES users(id),
  file_url VARCHAR(255),
  cover_image VARCHAR(255),
  system_requirements TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_id)
);

CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_id)
);

CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_id)
);

CREATE TABLE item_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  image_url VARCHAR(255),
  rarity VARCHAR(50) DEFAULT 'common',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_items (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(owner_id, item_type_id)
);

CREATE TABLE market_listings (
  id SERIAL PRIMARY KEY,
  item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE,
  seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 1),
  price DECIMAL(10,2) NOT NULL,
  is_sold BOOLEAN DEFAULT false,
  listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE market_transactions (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES market_listings(id),
  buyer_id INTEGER REFERENCES users(id),
  seller_id INTEGER REFERENCES users(id),
  item_type_id INTEGER REFERENCES item_types(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sold_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── POINT SHOP ───────────────────────────────────────────────

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

-- 3. INSERT THE STARTING DATA WITH SAFE IDS

-- Insert Users (Password for all is 'password123' using a standard bcrypt hash)
INSERT INTO users (id, name, email, password, address, balance) VALUES 
(1, 'Alice Smith', 'alice@example.com', '$2b$10$ZF28vaiuDjg1jQ/cBkOTdunJ.JT4IwCOJbiczMpR/NznvxwbcK5fe', '123 Test St', 1000.00),
(2, 'Bob Jones', 'bob@example.com', '$2b$10$ZF28vaiuDjg1jQ/cBkOTdunJ.JT4IwCOJbiczMpR/NznvxwbcK5fe', '456 Market Ave', 500.00),
(3, 'Charlie Gamer', 'charlie@example.com', '$2b$10$ZF28vaiuDjg1jQ/cBkOTdunJ.JT4IwCOJbiczMpR/NznvxwbcK5fe', '789 Play Rd', 250.00);

-- Insert Games
INSERT INTO games (id, title, description, genre, price, cover_image, age_rating, is_approved) VALUES 
(1, 'Nebula Siege', 'Epic space battles in a procedurally generated universe.', 'Action', 0.00, '🚀', '12+', true),
(2, 'Portal 2', 'Mind-bending puzzles with portals.', 'Puzzle', 10.00, '🌀', 'E', true),
(3, 'Cyberpunk 2077', 'Open-world action-adventure set in Night City.', 'RPG', 59.99, '🌃', '18+', true),
(4, 'Stardew Valley', 'Build your dream farm and restore the valley.', 'Simulation', 14.99, '🌱', 'E', true),
(5, 'Elden Ring', 'Rise, Tarnished, and be guided by grace.', 'RPG', 59.99, '⚔️', 'M', true),
(6, 'Hades', 'Defy the god of the dead as you hack and slash out of the Underworld.', 'Rogue-like', 24.99, '🔥', '12+', true),
(7, 'Terraria', 'Dig, fight, explore, build! Nothing is impossible.', 'Sandbox', 9.99, '🌳', 'E10+', true),
(8, 'Dota 2', 'The most-played game on Steam.', 'MOBA', 0.00, '⚔️', '12+', true),
(9, 'The Witcher 3', 'Hunt the child of prophecy in an open world.', 'RPG', 39.99, '🐺', '18+', true),
(10, 'Celeste', 'Help Madeline survive her inner demons on her journey to the top of Celeste Mountain.', 'Platformer', 19.99, '🍓', 'E10+', true);

-- Insert Item Types
INSERT INTO item_types (id, game_id, name, description, rarity) VALUES 
(1, 1, 'Plasma Sword', 'A glowing blade of pure energy.', 'Legendary'),
(2, 1, 'Heavy Shield', 'Provides massive defense.', 'Rare'),
(3, 2, 'Golden Portal Gun', 'A fancy version of the classic tool.', 'Legendary'),
(4, 4, 'Prismatic Shard', 'A very rare and powerful mineral.', 'Legendary'),
(5, 7, 'Terra Blade', 'The ultimate sword for any explorer.', 'Legendary'),
(6, 8, 'Dragonclaw Hook', 'A rare cosmetic for Pudge.', 'Immortal');

-- Insert User Items
INSERT INTO user_items (owner_id, item_type_id, quantity) VALUES 
(2, 1, 10), -- Bob has 10 Plasma Swords
(2, 4, 5),  -- Bob has 5 Prismatic Shards
(3, 2, 3),  -- Charlie has 3 Heavy Shields
(3, 6, 1);  -- Charlie has 1 Dragonclaw Hook

-- Insert Market Listings
INSERT INTO market_listings (item_type_id, seller_id, price, quantity, is_sold) VALUES 
(1, 2, 45.50, 1, false),
(1, 2, 48.00, 1, false),
(4, 2, 125.00, 1, false),
(2, 3, 15.00, 1, false),
(6, 3, 200.00, 1, false);

-- Insert Point Shop Rewards
INSERT INTO point_rewards (name, description, image_url, type, game_id, cost) VALUES
('Neon Cyan Frame', 'A glowing cyan avatar frame', NULL, 'avatar_frame', NULL, 500),
('Violet Halo Frame', 'A sleek violet avatar frame', NULL, 'avatar_frame', NULL, 750),
('Gold Crown Frame', 'Exclusive gold crown avatar frame', NULL, 'avatar_frame', NULL, 1500),
('Rookie Badge', 'You are just getting started!', NULL, 'badge', NULL, 200),
('Veteran Badge', 'Seasoned gamer badge', NULL, 'badge', NULL, 800),
('Legend Badge', 'Top-tier exclusive legend badge', NULL, 'badge', NULL, 2000),
('Cyberpunk Banner', 'A cyberpunk-styled profile banner', NULL, 'banner', NULL, 1000),
('Space Banner', 'Deep space aesthetic profile banner', NULL, 'banner', NULL, 1200),
('Dragon Banner', 'Fiery dragon profile banner', NULL, 'banner', NULL, 1800);

-- Insert Threads
INSERT INTO threads (game_id, user_id, title, content, tag) VALUES
(1, 1, 'Best strategy for levels 10+', 'Does anyone know the optimal build order for the later levels?', 'Discussion'),
(3, 2, 'Amazing graphics on the new update', 'The latest patch makes the neon lights pop so well.', 'Review');

-- Adjust Sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('games_id_seq', (SELECT MAX(id) FROM games));
SELECT setval('item_types_id_seq', (SELECT MAX(id) FROM item_types));
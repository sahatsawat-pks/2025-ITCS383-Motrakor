-- Add balance to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 1000.00;

-- Create item_types table
CREATE TABLE IF NOT EXISTS item_types (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    rarity VARCHAR(50) DEFAULT 'Common',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_items table
CREATE TABLE IF NOT EXISTS user_items (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id),
    item_type_id INTEGER REFERENCES item_types(id),
    quantity INTEGER DEFAULT 1,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(owner_id, item_type_id)
);

-- Note: The market_listings table in setup.sql uses item_id. 
-- The marketController.js uses item_type_id.
-- We should align them.

ALTER TABLE market_listings RENAME COLUMN item_id TO item_type_id;
ALTER TABLE market_listings ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

ALTER TABLE market_transactions RENAME COLUMN item_id TO item_type_id;
ALTER TABLE market_transactions ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Seed some data
INSERT INTO games (title, description, genre, price, cover_image, is_approved)
VALUES ('Portal 2', 'A puzzle game', 'Puzzle', 10.00, 'https://example.com/portal2.jpg', true)
ON CONFLICT DO NOTHING;

INSERT INTO item_types (game_id, name, description, rarity)
SELECT id, 'Companion Cube', 'A loyal friend', 'Legendary' FROM games WHERE title = 'Portal 2'
LIMIT 1
ON CONFLICT DO NOTHING;

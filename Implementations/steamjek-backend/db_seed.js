const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('🌱 Seeding database with 10 games...');

    // Clear existing data
    console.log('Cleaning up existing data...');
    await pool.query('TRUNCATE market_transactions, market_listings, user_items, item_types, ratings, purchases, wishlist, cart, games, users RESTART IDENTITY CASCADE');

    // Create Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('Creating users...');
    const users = await pool.query(`
      INSERT INTO users (name, email, password, address, balance)
      VALUES 
        ('Alice Smith', 'alice@example.com', $1, '123 Test St', 1000.00),
        ('Bob Jones', 'bob@example.com', $1, '456 Market Ave', 500.00),
        ('Charlie Gamer', 'charlie@example.com', $1, '789 Play Rd', 250.00)
      RETURNING id, name
    `, [hashedPassword]);
    const bobId = users.rows[1].id;
    const charlieId = users.rows[2].id;

    // Create 10 Games with Various Prices
    console.log('Creating 10 games catalog...');
    const gamesData = [
      ['Nebula Siege', 'Epic space battles in a procedurally generated universe.', 'Action', 0, '🚀', '12+', true],
      ['Portal 2', 'Mind-bending puzzles with portals.', 'Puzzle', 10, '🌀', 'E', true],
      ['Cyberpunk 2077', 'Open-world action-adventure set in Night City.', 'RPG', 59.99, '🌃', '18+', true],
      ['Stardew Valley', 'Build your dream farm and restore the valley.', 'Simulation', 14.99, '🌱', 'E', true],
      ['Elden Ring', 'Rise, Tarnished, and be guided by grace.', 'RPG', 59.99, '⚔️', 'M', true],
      ['Hades', 'Defy the god of the dead as you hack and slash out of the Underworld.', 'Rogue-like', 24.99, '🔥', '12+', true],
      ['Terraria', 'Dig, fight, explore, build! Nothing is impossible.', 'Sandbox', 9.99, '🌳', 'E10+', true],
      ['Dota 2', 'The most-played game on Steam.', 'MOBA', 0, '⚔️', '12+', true],
      ['The Witcher 3', 'Hunt the child of prophecy in an open world.', 'RPG', 39.99, '🐺', '18+', true],
      ['Celeste', 'Help Madeline survive her inner demons on her journey to the top of Celeste Mountain.', 'Platformer', 19.99, '🍓', 'E10+', true]
    ];

    const gameIds = [];
    for (const g of gamesData) {
      const res = await pool.query(
        `INSERT INTO games (title, description, genre, price, cover_image, age_rating, is_approved)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        g
      );
      gameIds.push(res.rows[0].id);
    }

    const [nebulaId, portalId, , stardewId, , , terrariaId, dotaId, , ] = gameIds;

    // Create Item Types for some of these games
    console.log('Creating item types...');
    const itemTypes = await pool.query(`
      INSERT INTO item_types (game_id, name, description, rarity)
      VALUES 
        ($1, 'Plasma Sword', 'A glowing blade of pure energy.', 'Legendary'),
        ($1, 'Heavy Shield', 'Provides massive defense.', 'Rare'),
        ($2, 'Golden Portal Gun', 'A fancy version of the classic tool.', 'Legendary'),
        ($3, 'Prismatic Shard', 'A very rare and powerful mineral.', 'Legendary'),
        ($4, 'Terra Blade', 'The ultimate sword for any explorer.', 'Legendary'),
        ($5, 'Dragonclaw Hook', 'A rare cosmetic for Pudge.', 'Immortal')
      RETURNING id, name
    `, [nebulaId, portalId, stardewId, terrariaId, dotaId]);

    const swordId = itemTypes.rows[0].id;
    const shieldId = itemTypes.rows[1].id;
    const shardId = itemTypes.rows[3].id;
    const hookId = itemTypes.rows[5].id;

    // Give Bob and Charlie some items for the marketplace
    console.log('Giving items to users...');
    await pool.query(`
      INSERT INTO user_items (owner_id, item_type_id, quantity)
      VALUES 
        ($1, $3, 10), -- Bob has 10 Swords
        ($1, $4, 5),  -- Bob has 5 Shards
        ($2, $5, 3),  -- Charlie has 3 Shields
        ($2, $6, 1)   -- Charlie has 1 Hook
    `, [bobId, charlieId, swordId, shardId, shieldId, hookId]);

    // Create Market Listings
    console.log('Creating market listings...');
    await pool.query(`
      INSERT INTO market_listings (item_type_id, seller_id, price, quantity, is_sold)
      VALUES 
        ($1, $2, 45.50, 1, false),
        ($1, $2, 48.00, 1, false),
        ($3, $2, 125.00, 1, false),
        ($4, $6, 15.00, 1, false),
        ($5, $6, 200.00, 1, false)
    `, [swordId, bobId, shardId, shieldId, hookId, charlieId]);

    console.log('✅ Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    process.exit(0);
  }
}

seed();

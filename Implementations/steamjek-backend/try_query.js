const pool = require('./db/index');
async function test() {
  try {
    const result = await pool.query(`SELECT ml.id, it.name, it.description, it.image_url, 
              it.rarity, ml.price, ml.quantity,
              u.name as seller_name, g.title as game_title,
              ml.listed_at
       FROM market_listings ml
       JOIN item_types it ON ml.item_type_id = it.id
       JOIN users u ON ml.seller_id = u.id
       JOIN games g ON it.game_id = g.id
       WHERE ml.is_sold = false
       ORDER BY ml.listed_at DESC`);
    console.log("Success", result.rows.length);
  } catch (err) {
    console.error("FAIL:", err);
  }
  process.exit();
}
test();

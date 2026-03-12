const pool = require('./db');

async function testDownload() {
  try {
    const res = await pool.query('SELECT id, title FROM games LIMIT 10');
    console.log('Sample games on DB:', JSON.stringify(res.rows, null, 2));
    
    if (res.rows.length === 0) {
        console.warn('No games found in database!');
    } else {
        const game = res.rows[0];
        console.log('Attempting simulated download for ID:', game.id);
        const result = await pool.query('SELECT title FROM games WHERE id = $1', [game.id]);
        if (result.rows.length === 0) {
            console.error('Game not found via individual query!');
        } else {
            console.log('Download SUCCESS for ID', game.id, 'returns content:', result.rows[0].title);
        }
    }
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await pool.end();
  }
}

testDownload();

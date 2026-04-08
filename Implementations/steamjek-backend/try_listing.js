const pool = require('./db/index');
async function test() {
  try {
    const res = await pool.query('SELECT 1 as val');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();

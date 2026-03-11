const pool = require('./db');

async function listTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in database:');
    result.rows.forEach(row => console.log(' - ' + row.table_name));
    
    for (const row of result.rows) {
      const cols = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [row.table_name]);
      console.log(`Columns in ${row.table_name}:`, cols.rows.map(c => c.column_name).join(', '));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error listing tables:', err);
    process.exit(1);
  }
}

listTables();

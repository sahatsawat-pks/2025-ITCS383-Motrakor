const pool = require('./db');
const fs = require("node:fs");
const path = require("node:path");

async function migrate() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'db', 'migrate_v2.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Database migrated successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();

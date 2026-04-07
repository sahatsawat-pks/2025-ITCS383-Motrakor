const { Pool } = require('@neondatabase/serverless');
const path = require("node:path");
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let poolConfig;
if (process.env.DATABASE_URL) {
  let connStr = process.env.DATABASE_URL;
  if (!connStr.includes('sslmode=require')) {
    connStr += connStr.includes('?') ? '&sslmode=require' : '?sslmode=require';
  }
  poolConfig = { connectionString: connStr, ssl: { rejectUnauthorized: false } };
} else {
  poolConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
}
const pool = new Pool(poolConfig);

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ Database connection error:', err));

module.exports = pool;
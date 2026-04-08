const path = require("node:path");
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let Pool;
if (process.env.DB_HOST === 'localhost' || process.env.NODE_ENV === 'test') {
  Pool = require('pg').Pool; // Use standard tcp pg connection for local tests (like GitHub Actions)
} else {
  const neon = require('@neondatabase/serverless');
  Pool = neon.Pool;
  neon.neonConfig.webSocketConstructor = require('ws'); // Use WebSockets for Neon connection
}

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

module.exports = pool;
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.resolve(process.env.DB_PATH || './data/dishes.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS dishes (
    dishId      TEXT PRIMARY KEY,
    dishName    TEXT NOT NULL,
    imageUrl    TEXT NOT NULL,
    isPublished INTEGER NOT NULL DEFAULT 0,
    version     INTEGER NOT NULL DEFAULT 1
  )
`);

module.exports = db;
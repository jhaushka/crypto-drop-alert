const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../alerts.db'));

// Create tables on first run
db.exec(`
  CREATE TABLE IF NOT EXISTS alerts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    coin_id     TEXT    NOT NULL,
    coin_name   TEXT    NOT NULL,
    coin_symbol TEXT    NOT NULL,
    threshold   REAL    NOT NULL,
    created_at  TEXT    DEFAULT (datetime('now'))
  );
`);

module.exports = db;
// NEW (Absolute pathing to the Electron node_modules)
const sqlite3 = require('../../Electron/node_modules/sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  connect() {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) console.error('Database connection error:', err.message);
      else console.log('Connected to the SQLite database.');
    });
    this.initSchema();
  }

  initSchema() {
    this.db.run(`CREATE TABLE IF NOT EXISTS fitreps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        grade TEXT,
        data TEXT
    )`);
  }

  async save(fitrepData) {
    const dataString = JSON.stringify(fitrepData);
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO fitreps (name, grade, data) VALUES (?, ?, ?)`;
      this.db.run(sql, [fitrepData.name, fitrepData.grade, dataString], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  async loadAll() {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT id, name, grade FROM fitreps ORDER BY id DESC`, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Database;
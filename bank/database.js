const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank TEXT,
    name TEXT,
    iban TEXT,
    balance INTEGER,
    currency TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    messageId INTEGER,
    senderId INTEGER,
    receiverId INTEGER,
    amountSent INTEGER,
    amountReceived INTEGER,
    currencySent TEXT,
    currencyReceived TEXT,
    status TEXT,
    FOREIGN KEY(senderId) REFERENCES customers(id),
    FOREIGN KEY(receiverId) REFERENCES customers(id)
  )`);
});

module.exports = db;

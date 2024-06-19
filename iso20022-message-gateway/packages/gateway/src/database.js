const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS entities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        address TEXT,
        privateKey TEXT,
        currency TEXT
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        encryptedData TEXT,
        iv TEXT,
        messageHash TEXT,
        ticketId TEXT,
        parent TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS symmetricKeys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        messageId INTEGER,
        encryptedKey TEXT,
        iv TEXT,
        salt TEXT,
        publicKey TEXT,
        FOREIGN KEY(messageId) REFERENCES messages(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messageEntities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        messageId INTEGER,
        entityId INTEGER,
        FOREIGN KEY(messageId) REFERENCES messages(id),
        FOREIGN KEY(entityId) REFERENCES entities(id)
    )`);
});

module.exports = db;

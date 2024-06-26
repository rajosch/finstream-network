const db = require('../utils/database');

exports.getAllEntities = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM entities', [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
};

exports.createEntity = (name, address, privateKey, currency) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO entities (name, address, privateKey, currency) VALUES (?, ?, ?, ?)');
    stmt.run(name, address, privateKey, currency, function (err) {
      if (err) {
        return reject(err);
      }
      resolve(this.lastID);
    });
    stmt.finalize();
  });
};

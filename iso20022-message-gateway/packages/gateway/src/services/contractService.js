const db = require('../utils/database');

exports.getAllContracts = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM contracts', [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
};

exports.createContract = (name, address) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO contracts (name, address) VALUES (?, ?)');
    stmt.run(name, address, function (err) {
      if (err) {
        return reject(err);
      }
      resolve(this.lastID);
    });
    stmt.finalize();
  });
};

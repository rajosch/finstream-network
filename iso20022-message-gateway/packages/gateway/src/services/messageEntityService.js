const db = require('../utils/database');

exports.getAllMessageEntities = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM messageEntities', [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
};

exports.createMessageEntity = (messageId, entityId) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO messageEntities (messageId, entityId) VALUES (?, ?)');
    stmt.run(messageId, entityId, function (err) {
      if (err) {
        return reject(err);
      }
      resolve(this.lastID);
    });
    stmt.finalize();
  });
};

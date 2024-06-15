const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Populate entities and customers tables
const populateTables = () => {
  const entities = [
    {
      name: 'Bank USA',
      // Wallets created for the purpose of the PoC. !!DO NOT USE THEM TO HANDLE ANY REAL FUNDS!!
      address: '0xFB78AF53Fc9BD34f9E078aCb912e8103F08C4819',
      privateKey: '0xb62244005a84f03a995f9109187cac189f3e5d124016d52c731bf119a93cc8da',
      customers: [
        { name: 'Alice', balance: 20000 },
        { name: 'Charlie', balance: 5000 }
      ],
      currency: '$'
    },
    {
      name: 'Bank EU',
      // Wallets created for the purpose of the PoC. !!DO NOT USE THEM TO HANDLE ANY REAL FUNDS!!
      address: '0xe725c3F6534563483D3a0Ede818868ceBB1a8c80',
      privateKey: '0x29e23620daa4f30387565e3fea55bd415cfe8f26c1d6886ce25b801b887cc8da',
      customers: [
        { name: 'Bob', balance: 80000 },
        { name: 'Diana', balance: 2000 }
      ],
      currency: '€'
    },
    {
      name: 'gateway',
      // Wallets created for the purpose of the PoC. !!DO NOT USE THEM TO HANDLE ANY REAL FUNDS!!
      address: '0x3638Ee16d0FF3c81A5a104C555ab466b6129FF51',
      privateKey: '0x7d5ce42ce71af1817a82a4d94939a71094fa9866138ac8548e5300eaeab179c9',
      customers: [],
      currency: ''
    }
  ];

  entities.forEach(entity => {
    const stmt = db.prepare('INSERT INTO entities (name, address, privateKey, currency) VALUES (?, ?, ?, ?)');
    stmt.run(entity.name, entity.address, entity.privateKey, entity.currency, function (err) {
      if (err) {
        console.error('Error inserting entity:', err);
      } else {
        const entityId = this.lastID;
        const customerStmt = db.prepare('INSERT INTO customers (entityId, name, balance) VALUES (?, ?, ?)');
        entity.customers.forEach(customer => {
          customerStmt.run(entityId, customer.name, customer.balance, err => {
            if (err) {
              console.error('Error inserting customer:', err);
            }
          });
        });
        customerStmt.finalize();
      }
    });
    stmt.finalize();
  });
};

// Populate tables on server start
populateTables();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Route to save gateway data
app.post('/messages', (req, res) => {
  const { encryptedData, symmetricKey, iv, messageHash, ticketId, parent, entityIds } = req.body;

  const stmt = db.prepare('INSERT INTO messages (encryptedData, iv, messageHash, ticketId, parent) VALUES (?, ?, ?, ?, ?)');
  stmt.run(JSON.stringify(encryptedData), JSON.stringify(iv), messageHash, ticketId, parent, function (err) {
    if (err) {
      return res.status(500).send(err.message);
    }

    const messageId = this.lastID;
    const symmetricKeyStmt = db.prepare('INSERT INTO symmetricKeys (messageId, encryptedKey, iv, salt, publicKey) VALUES (?, ?, ?, ?, ?)');

    symmetricKey.forEach(key => {
      symmetricKeyStmt.run(messageId, JSON.stringify(key.encryptedKey), JSON.stringify(key.iv), JSON.stringify(key.salt), key.publicKey, (err) => {
        if (err) {
          return res.status(500).send(err.message);
        }
      });
    });

    symmetricKeyStmt.finalize();

    if (entityIds && entityIds.length > 0) {
      const messageEntityStmt = db.prepare('INSERT INTO messageEntities (messageId, entityId) VALUES (?, ?)');

      entityIds.forEach(entityId => {
        messageEntityStmt.run(messageId, entityId, (err) => {
          if (err) {
            return res.status(500).send(err.message);
          }
        });
      });

      messageEntityStmt.finalize();
    }

    res.status(201).send({ messageId });
  });
  stmt.finalize();
});

// Route to get all messages data
app.get('/messages', (req, res) => {
  db.all('SELECT * FROM messages', [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    const dataPromises = rows.map(row => new Promise((resolve, reject) => {
      db.all('SELECT * FROM symmetricKeys WHERE messageId = ?', [row.id], (err, keys) => {
        if (err) {
          return reject(err);
        }
        row.symmetricKey = keys.map(key => ({
          encryptedKey: JSON.parse(key.encryptedKey),
          iv: JSON.parse(key.iv),
          salt: JSON.parse(key.salt),
          publicKey: key.publicKey
        }));

        db.all('SELECT entityId FROM messageEntities WHERE messageId = ?', [row.id], (err, entityIds) => {
          if (err) {
            return reject(err);
          }
          row.entityIds = entityIds.map(e => e.entityId);
          resolve(row);
        });
      });
    }));

    Promise.all(dataPromises)
      .then(results => res.send(results))
      .catch(err => res.status(500).send(err.message));
  });
});

// Route to list all tables
app.get('/tables', (req, res) => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send(rows.map(row => row.name));
  });
});

// Route to get all entities
app.get('/entities', (req, res) => {
  db.all('SELECT * FROM entities', [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send(rows);
  });
});

// Route to get all customers
app.get('/customers', (req, res) => {
  db.all('SELECT * FROM customers', [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send(rows);
  });
});

// Route to add a new entity
app.post('/entities', (req, res) => {
  const { name, address, privateKey, customers } = req.body;

  const stmt = db.prepare('INSERT INTO entities (name, address, privateKey) VALUES (?, ?, ?)');
  stmt.run(name, address, privateKey, function (err) {
    if (err) {
      return res.status(500).send(err.message);
    }

    const entityId = this.lastID;
    if (customers && customers.length > 0) {
      const customerStmt = db.prepare('INSERT INTO customers (entityId, name, balance) VALUES (?, ?, ?)');
      customers.forEach(customer => {
        customerStmt.run(entityId, customer.name, customer.balance, err => {
          if (err) {
            console.error('Error inserting customer:', err);
          }
        });
      });
      customerStmt.finalize();
    }

    res.status(201).send({ entityId });
  });
  stmt.finalize();
});

// Route to add a new customer
app.post('/customers', (req, res) => {
  const { entityId, name, balance } = req.body;

  const stmt = db.prepare('INSERT INTO customers (entityId, name, balance) VALUES (?, ?, ?)');
  stmt.run(entityId, name, balance, function (err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(201).send({ customerId: this.lastID });
  });
  stmt.finalize();
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

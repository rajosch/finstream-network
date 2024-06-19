const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const protobuf = require('protobufjs');
const db = require('./database');

// const { createMessage } = require('../iso20022-message-gateway/packages/gateway/src');
// const { buildMerkleTree } = require('../iso20022-message-gateway/packages/merkle-tree-validator/src');

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Populate entities table
const populateTables = () => {
  const entities = [
    {
      name: 'Bank USA',
      // Wallets created for the purpose of the PoC. !!DO NOT USE THEM TO HANDLE ANY REAL FUNDS!!
      address: '0xFB78AF53Fc9BD34f9E078aCb912e8103F08C4819',
      privateKey: '0xb62244005a84f03a995f9109187cac189f3e5d124016d52c731bf119a93cc8da',
      currency: '$'
    },
    {
      name: 'Bank EU',
      // Wallets created for the purpose of the PoC. !!DO NOT USE THEM TO HANDLE ANY REAL FUNDS!!
      address: '0xe725c3F6534563483D3a0Ede818868ceBB1a8c80',
      privateKey: '0x29e23620daa4f30387565e3fea55bd415cfe8f26c1d6886ce25b801b887cc8da',
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
      }
    });
    stmt.finalize();
  });
};

// Populate tables on server start
populateTables();

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
  
app.get('/', (req, res) => {
    res.send('Gateway Server');
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

app.post('/create-message', async (req, res) => {
const { messageType, wallets, messageArgs, ticketId, parent } = req.body;

try {
    // Load XSD and Proto files
    const xsdPath = path.join(__dirname, '../../../../files/definitions', `${messageType}.xsd`);
    const protoPath = path.join(__dirname, '../../../../files/protobuf', `${messageType}.proto`);

    const root = protobuf.loadSync(protoPath);
    const xsdContent = fs.readFileSync(xsdPath, 'utf-8');

    // Create the message using the loaded XSD and Proto contents
    const encryptedMessage = await createMessage(messageType, wallets, messageArgs, ticketId, xsdContent, root, parent);

    if (encryptedMessage) {
    // Insert into messages table
    const messageStmt = db.prepare('INSERT INTO messages (encryptedData, iv, messageHash, ticketId, parent) VALUES (?, ?, ?, ?, ?)');
    messageStmt.run(encryptedMessage.encryptedData, encryptedMessage.iv, encryptedMessage.messageHash, ticketId, encryptedMessage.parent, function(err) {
        if (err) {
        return res.status(500).send('Failed to insert message');
        }

        const messageId = this.lastID;

        // Insert into transactions table
        const transactionStmt = db.prepare('INSERT INTO transactions (messageId, status, createdAt) VALUES (?, ?, ?)');
        transactionStmt.run(messageId, 'created', new Date(), function(err) {
        if (err) {
            return res.status(500).send('Failed to insert transaction');
        }

        res.status(201).send({ message: 'Message and transaction created successfully', messageId: messageId });
        });
        transactionStmt.finalize();
    });
    messageStmt.finalize();
    } else {
    res.status(400).send('Message creation failed');
    }
} catch (error) {
    console.error('Error creating message:', error);
    res.status(500).send('Server error');
}
});
  
app.get('/messages/:ticketId/connected', (req, res) => {
const ticketId = req.params.ticketId;

const initialQuery = 'SELECT * FROM messages WHERE ticketId = ?';

db.get(initialQuery, [ticketId], (err, rootMessage) => {
    if (err) {
    return res.status(500).send(err.message);
    }
    if (!rootMessage) {
    return res.status(404).send('Message not found');
    }

    const query = `
    WITH RECURSIVE connected_messages AS (
        SELECT * FROM messages WHERE id = ?
        UNION ALL
        SELECT m.* FROM messages m
        INNER JOIN connected_messages cm ON m.parent = cm.id
    )
    SELECT * FROM connected_messages ORDER BY id;
    `;

    db.all(query, [rootMessage.id], (err, rows) => {
    if (err) {
        return res.status(500).send(err.message);
    }
    res.send(rows);
    });
});
});

app.get('/messages/:ticketId/create-merkle-tree', (req, res) => {
const ticketId = req.params.ticketId;

const initialQuery = 'SELECT * FROM messages WHERE ticketId = ?';

db.get(initialQuery, [ticketId], (err, rootMessage) => {
    if (err) {
    return res.status(500).send(err.message);
    }
    if (!rootMessage) {
    return res.status(404).send('Message not found');
    }

    const query = `
    WITH RECURSIVE connected_messages AS (
        SELECT * FROM messages WHERE id = ?
        UNION
        SELECT m.* FROM messages m
        INNER JOIN connected_messages cm ON m.parent = cm.id
    )
    SELECT * FROM connected_messages ORDER BY id;
    `;

    db.all(query, [rootMessage.id], (err, rows) => {
    if (err) {
        return res.status(500).send(err.message);
    }

    const values = rows.map(row => [row.encryptedData]);
    const leafEncoding = ['string']; 

    console.log(values)

    const merkleTree = buildMerkleTree(values, leafEncoding);
    res.send(merkleTree);
    });
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

// Route to add a new entity
app.post('/entities', (req, res) => {
  const { name, address, privateKey, customers, currency } = req.body;

  const stmt = db.prepare('INSERT INTO entities (name, address, privateKey, currency) VALUES (?, ?, ?, ?)');
  stmt.run(name, address, privateKey, function (err) {
    if (err) {
      return res.status(500).send(err.message);
    }

    const entityId = this.lastID;
    if (customers && customers.length > 0) {
      const customerStmt = db.prepare('INSERT INTO customers (entityId, name, iban, balance) VALUES (?, ?, ?, ?)');
      customers.forEach(customer => {
        customerStmt.run(entityId, customer.name, customer.iban, customer.balance, err => {
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


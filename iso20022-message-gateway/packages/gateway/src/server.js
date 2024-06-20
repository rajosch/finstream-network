const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const protobuf = require('protobufjs');
const db = require('./database');

const { orderMessages } = require('./index');

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const insertMessagesSequentially = async () => {
  const messages = [
    { encryptedData: 'data1', iv: 'iv1', messageHash: 'hash1', ticketId: 'ticket1', parent: null },
    { encryptedData: 'data2', iv: 'iv2', messageHash: 'hash2', ticketId: 'ticket2', parent: null },
    { encryptedData: 'data3', iv: 'iv3', messageHash: 'hash3', ticketId: 'ticket3', parent: null },
    { encryptedData: 'data4', iv: 'iv4', messageHash: 'hash4', ticketId: 'ticket1', parent: 1 },
    { encryptedData: 'data5', iv: 'iv5', messageHash: 'hash5', ticketId: 'ticket1', parent: 4 },
    { encryptedData: 'data6', iv: 'iv6', messageHash: 'hash6', ticketId: 'ticket1', parent: 5 },
    { encryptedData: 'data7', iv: 'iv7', messageHash: 'hash7', ticketId: 'ticket2', parent: 2 },
    { encryptedData: 'data8', iv: 'iv8', messageHash: 'hash8', ticketId: 'ticket2', parent: 7 },
    { encryptedData: 'data9', iv: 'iv9', messageHash: 'hash9', ticketId: 'ticket3', parent: 3 },
    { encryptedData: 'data10', iv: 'iv10', messageHash: 'hash10', ticketId: 'ticket3', parent: 9 }
  ];

  for (const message of messages) {
    await new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO messages (encryptedData, iv, messageHash, ticketId, parent) VALUES (?, ?, ?, ?, ?)');
      stmt.run(message.encryptedData, message.iv, message.messageHash, message.ticketId, message.parent, function (err) {
        if (err) {
          console.error('Error inserting message:', err);
          reject(err);
        } else {
          resolve();
        }
      });
      stmt.finalize();
    });
  }
};

const insertMessageEntities = async () => {
  const entityIds = {
    'Bank USA': 1,
    'Bank EU': 2,
    'gateway': 3
  };

  const messageEntities = [
    { messageId: 1, entityIds: [entityIds['Bank USA'], entityIds['gateway']] },
    { messageId: 4, entityIds: [entityIds['Bank USA'], entityIds['gateway']] },
    { messageId: 5, entityIds: [entityIds['Bank USA'], entityIds['gateway']] },
    { messageId: 6, entityIds: [entityIds['Bank USA'], entityIds['gateway']] },
    { messageId: 2, entityIds: [entityIds['Bank EU'], entityIds['gateway']] },
    { messageId: 7, entityIds: [entityIds['Bank EU'], entityIds['gateway']] },
    { messageId: 8, entityIds: [entityIds['Bank EU'], entityIds['gateway']] },
    { messageId: 3, entityIds: [entityIds['Bank USA'], entityIds['Bank EU'], entityIds['gateway']] },
    { messageId: 9, entityIds: [entityIds['Bank USA'], entityIds['Bank EU'], entityIds['gateway']] },
    { messageId: 10, entityIds: [entityIds['Bank USA'], entityIds['Bank EU'], entityIds['gateway']] }
  ];

  for (const messageEntity of messageEntities) {
    for (const entityId of messageEntity.entityIds) {
      await new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO messageEntities (messageId, entityId) VALUES (?, ?)');
        stmt.run(messageEntity.messageId, entityId, function (err) {
          if (err) {
            console.error('Error inserting message entity:', err);
            reject(err);
          } else {
            resolve();
          }
        });
        stmt.finalize();
      });
    }
  }
};

const insertEntitiesSequentially = async () => {
  const entities = [
    {
      name: 'Bank USA',
      address: '0xFB78AF53Fc9BD34f9E078aCb912e8103F08C4819',
      privateKey: '0xb62244005a84f03a995f9109187cac189f3e5d124016d52c731bf119a93cc8da',
      currency: '$'
    },
    {
      name: 'Bank EU',
      address: '0xe725c3F6534563483D3a0Ede818868ceBB1a8c80',
      privateKey: '0x29e23620daa4f30387565e3fea55bd415cfe8f26c1d6886ce25b801b887cc8da',
      currency: '€'
    },
    {
      name: 'gateway',
      address: '0x3638Ee16d0FF3c81A5a104C555ab466b6129FF51',
      privateKey: '0x7d5ce42ce71af1817a82a4d94939a71094fa9866138ac8548e5300eaeab179c9',
      customers: [],
      currency: ''
    }
  ];

  for (const entity of entities) {
    await new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO entities (name, address, privateKey, currency) VALUES (?, ?, ?, ?)');
      stmt.run(entity.name, entity.address, entity.privateKey, entity.currency, function (err) {
        if (err) {
          console.error('Error inserting entity:', err);
          reject(err);
        } else {
          resolve();
        }
      });
      stmt.finalize();
    });
  }

  await insertMessagesSequentially();
  await insertMessageEntities();
};

insertEntitiesSequentially();

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});


app.get('/', (req, res) => {
  res.send('Gateway Server');
});

app.get('/tables', (req, res) => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send(rows.map(row => row.name));
  });
});

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

app.post('/create-message', async (req, res) => {
  const { messageType, wallets, messageArgs, ticketId, parent } = req.body;

  try {
    const xsdPath = path.join(__dirname, '../../../../files/definitions', `${messageType}.xsd`);
    const protoPath = path.join(__dirname, '../../../../files/protobuf', `${messageType}.proto`);

    const root = protobuf.loadSync(protoPath);
    const xsdContent = fs.readFileSync(xsdPath, 'utf-8');

    const encryptedMessage = await createMessage(messageType, wallets, messageArgs, ticketId, xsdContent, root, parent);

    if (encryptedMessage) {
      const messageStmt = db.prepare('INSERT INTO messages (encryptedData, iv, messageHash, ticketId, parent) VALUES (?, ?, ?, ?, ?)');
      messageStmt.run(encryptedMessage.encryptedData, encryptedMessage.iv, encryptedMessage.messageHash, ticketId, encryptedMessage.parent, function (err) {
        if (err) {
          return res.status(500).send('Failed to insert message');
        }

        const messageId = this.lastID;

        const transactionStmt = db.prepare('INSERT INTO transactions (messageId, status, createdAt) VALUES (?, ?, ?)');
        transactionStmt.run(messageId, 'created', new Date(), function (err) {
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

app.get('/messages/:ticketId', (req, res) => {
  const ticketId = req.params.ticketId;

  const query = 'SELECT * FROM messages WHERE ticketId = ?';

  db.all(query, [ticketId], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    if (!rows || rows.length === 0) {
      return res.status(404).send('Messages not found');
    }
    
    const orderedMessages = orderMessages(rows);
    res.send(orderedMessages);
  });
});

// TODO fix this
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

      console.log(values);

      const merkleTree = buildMerkleTree(values, leafEncoding);
      res.send(merkleTree);
    });
  });
});

app.get('/entities', (req, res) => {
  db.all('SELECT * FROM entities', [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send(rows);
  });
});

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

app.get('/messageEntities', (req, res) => {
  db.all('SELECT * FROM messageEntities', [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send(rows);
  });
});

app.post('/messageEntities', (req, res) => {
  const { messageId, entityId } = req.body;
  const sql = 'INSERT INTO messageEntities (messageId, entityId) VALUES (?, ?)';

  db.run(sql, [messageId, entityId], function (err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send({ id: this.lastID });
  });
});

app.get('/messages/:ticketId/entity/:entityName', async (req, res) => {
  const { ticketId, entityName } = req.params;

  try {
    // Fetch the entity ID based on the entity name
    const entityQuery = 'SELECT id FROM entities WHERE name = ?';
    const entity = await new Promise((resolve, reject) => {
      db.get(entityQuery, [entityName], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });

    if (!entity) {
      return res.status(404).send('Entity not found');
    }

    // Fetch the message IDs connected to the entity ID
    const messageEntityQuery = `
      SELECT messageId FROM messageEntities 
      WHERE entityId = ?
    `;
    const messageEntities = await new Promise((resolve, reject) => {
      db.all(messageEntityQuery, [entity.id], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    if (messageEntities.length === 0) {
      return res.status(404).send('No messages found for this entity');
    }

    // Extract message IDs
    const messageIds = messageEntities.map(me => me.messageId);

    // Fetch messages connected to the ticketId and the entity
    const messagesQuery = `
      SELECT * FROM messages
      WHERE ticketId = ? AND id IN (${messageIds.join(',')})
    `;
    const messages = await new Promise((resolve, reject) => {
      db.all(messagesQuery, [ticketId], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    res.send(messages);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/messages/entity/:entityName', async (req, res) => {
  const { entityName } = req.params;

  try {
    // Fetch the entity ID based on the entity name
    const entityQuery = 'SELECT id FROM entities WHERE name = ?';
    const entity = await new Promise((resolve, reject) => {
      db.get(entityQuery, [entityName], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });

    if (!entity) {
      return res.status(404).send('Entity not found');
    }

    // Fetch the message IDs connected to the entity ID
    const messageEntityQuery = `
      SELECT messageId FROM messageEntities 
      WHERE entityId = ?
    `;
    const messageEntities = await new Promise((resolve, reject) => {
      db.all(messageEntityQuery, [entity.id], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    if (messageEntities.length === 0) {
      return res.status(404).send('No messages found for this entity');
    }

    // Extract message IDs
    const messageIds = messageEntities.map(me => me.messageId);

    // Fetch messages connected to the entity
    const messagesQuery = `
      SELECT * FROM messages
      WHERE id IN (${messageIds.join(',')})
    `;
    const messages = await new Promise((resolve, reject) => {
      db.all(messagesQuery, [], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    // Group messages by ticketId
    const groupedMessages = messages.reduce((acc, message) => {
      if (!acc[message.ticketId]) {
        acc[message.ticketId] = [];
      }
      acc[message.ticketId].push(message);
      return acc;
    }, {});

    // Convert the grouped messages object to an array of arrays
    const result = Object.values(groupedMessages);

    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

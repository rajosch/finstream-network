const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const protobuf = require('protobufjs');
const db = require('./database');

const { orderMessages, createMessage } = require('./index');
const { buildMerkleTree, createProof, verifyProof } = require('../../merkle-tree-validator/src/index');

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const insertMessagesSequentially = async () => {
  const messages = [
    { data: 'data1', messageHash: 'hash1', ticketId: 'ticket1', parent: null, verified: 'unverified' },
    { data: 'data2', messageHash: 'hash2', ticketId: 'ticket2', parent: null, verified: 'unverified' },
    { data: 'data3', messageHash: 'hash3', ticketId: 'ticket3', parent: null, verified: 'unverified' },
    { data: 'data4', messageHash: 'hash4', ticketId: 'ticket1', parent: 1, verified: 'unverified' },
    { data: 'data5', messageHash: 'hash5', ticketId: 'ticket1', parent: 4, verified: 'unverified' },
    { data: 'data6', messageHash: 'hash6', ticketId: 'ticket1', parent: 5, verified: 'unverified' },
    { data: 'data7', messageHash: 'hash7', ticketId: 'ticket2', parent: 2, verified: 'unverified' },
    { data: 'data8', messageHash: 'hash8', ticketId: 'ticket2', parent: 7, verified: 'unverified' },
    { data: 'data9', messageHash: 'hash9', ticketId: 'ticket3', parent: 3, verified: 'unverified' },
    { data: 'data10', messageHash: 'hash10', ticketId: 'ticket3', parent: 9, verified: 'unverified' }
  ];

  for (const message of messages) {
    await new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO messages (data, messageHash, ticketId, parent, verified) VALUES (?, ?, ?, ?, ?)');
      stmt.run(message.data, message.messageHash, message.ticketId, message.parent, message.verified, function (err) {
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
  const { data, messageHash, ticketId, parent, entityIds, verified } = req.body;

  const stmt = db.prepare('INSERT INTO messages (data, messageHash, ticketId, parent, verified) VALUES (?, ?, ?, ?, ?)');
  stmt.run(JSON.stringify(data), JSON.stringify(iv), messageHash, ticketId, parent, verified, function (err) {
    if (err) {
      return res.status(500).send(err.message);
    }

    const messageId = this.lastID;
    // const symmetricKeyStmt = db.prepare('INSERT INTO symmetricKeys (messageId, encryptedKey, iv, salt, publicKey) VALUES (?, ?, ?, ?, ?)');

    // symmetricKey.forEach(key => {
    //   symmetricKeyStmt.run(messageId, JSON.stringify(key.encryptedKey), JSON.stringify(key.iv), JSON.stringify(key.salt), key.publicKey, (err) => {
    //     if (err) {
    //       return res.status(500).send(err.message);
    //     }
    //   });
    // });

    // symmetricKeyStmt.finalize();

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
  const { messageType, messageArgs, ticketId, parent, entityIds } = req.body;

  try {
    const xsdPath = path.join(__dirname, '../../../../files/definitions', `${messageType}.xsd`);
    const protoPath = path.join(__dirname, '../../../../files/protobuf', `${messageType}.proto`);

    const root = protobuf.loadSync(protoPath);
    const xsdContent = fs.readFileSync(xsdPath, 'utf-8');

    const message = await createMessage(messageType, messageArgs, ticketId, xsdContent, root, parent);

    if (message) {
      const messageStmt = db.prepare('INSERT INTO messages (data,  messageHash, ticketId, parent, verified) VALUES (?, ?, ?, ?, ?)');
      messageStmt.run(message.data.toString('hex'), message.messageHash, ticketId, message.parent, 'unverified', function (err) {
        if (err) {
          return res.status(500).send('Failed to insert message');
        }
        const messageId = this.lastID;

        // Insert all entity IDs in parallel and wait for all to complete
        const insertEntityPromises = entityIds.map(entityId => {
          return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO messageEntities (messageId, entityId) VALUES (?, ?)';
            db.run(sql, [messageId, entityId], function (err) {
              if (err) {
                reject(err);
              } else {
                resolve(this.lastID);
              }
            });
          });
        });

        Promise.all(insertEntityPromises)
          .then(results => {
            res.status(201).send({ message: 'Message created successfully', messageId: messageId, entityIds: results });
          })
          .catch(error => {
            res.status(500).send(error.message);
          });
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
      db.all('SELECT entityId FROM messageEntities WHERE messageId = ?', [row.id], (err, entityIds) => {
        if (err) {
          return reject(err);
        }
        row.entityIds = entityIds.map(e => e.entityId);
        resolve(row);
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

app.put('/messages/:id/verified', (req, res) => {
  const messageId = req.params.id;
  const { newState } = req.body;

  if (typeof newState !== 'string') {
      return res.status(400).send('New state must be a string');
  }

  const stmt = db.prepare('UPDATE messages SET verified = ? WHERE id = ?');
  stmt.run(newState, messageId, function(err) {
      if (err) {
      return res.status(500).send('Failed to update state');
      }
      if (this.changes === 0) {
      return res.status(404).send('Message not found');
      }
      res.status(200).send('State updated successfully');
  });
  stmt.finalize();
});

app.get('/messages/:ticketId/create-merkle-tree', (req, res) => {
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

    // Strip message hashes of the message objects
    const messageHashes = orderedMessages.map(obj => [obj.messageHash]);

    const leafEncoding = ['string'];

    const merkleTree = buildMerkleTree(messageHashes, leafEncoding);

    res.send(merkleTree);
  });
});

// TODO verify agains on-chain root
app.get('/messages/:ticketId/:messageHash/verify', async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const messageHash = req.params.messageHash;

    const query = 'SELECT * FROM messages WHERE ticketId = ?';
    const rows = await new Promise((resolve, reject) => {
      db.all(query, [ticketId], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    if (!rows || rows.length === 0) {
      return res.status(404).send({ result: false, message: 'Messages not found' });
    }
    
    const orderedMessages = orderMessages(rows);

    // Strip message hashes of the message objects
    const messageHashes = orderedMessages.map(obj => [obj.messageHash]);

    const leafEncoding = ['string'];

    const merkleTree = buildMerkleTree(messageHashes, leafEncoding);

    // Check if the Merkle tree root equals that saved on-chain
    // const onChainRoot = await getRoot(ticketId);
    // if (onChainRoot !== merkleTree.root) {
    //   return res.send({ result: false, message: 'Data corruption detected: On-chain root does not match Merkle tree root' });
    // }

    const proof = createProof(merkleTree, [messageHash]);

    const result = verifyProof(merkleTree.root, leafEncoding, [messageHash], proof);

    if (!result) {
      return res.send({ result: false, message: 'Verification failed: Proof could not be verified' });
    }

    res.send({ result: true, message: 'Proof successfully verified' });

  } catch (err) {
    res.status(500).send({ result: false, message: `Internal server error: ${err.message}` });
  }
});

app.get('/entities', (req, res) => {
  db.all('SELECT * FROM entities', [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send(rows);
  });
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

const fs = require('fs');
const path = require('path');
const protobuf = require('protobufjs');

const db = require('../utils/database');
const { buildMerkleTree, createProof, verifyProof } = require('../utils/merkleTree');
const { orderMessages, createMessage } = require('../utils/message');

exports.getAllMessages = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM messages', [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
};

exports.getMessagesByTicketId = (ticketId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM messages WHERE ticketId = ?';
    db.all(query, [ticketId], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
};

exports.createMessage = async (messageType, messageArgs, ticketId, parent, entityIds) => {
  const xsdPath = path.join(__dirname, '../../../../../files/definitions', `${messageType}.xsd`);
  const protoPath = path.join(__dirname, '../../../../../files/protobuf', `${messageType}.proto`);

  const root = protobuf.loadSync(protoPath);
  const xsdContent = fs.readFileSync(xsdPath, 'utf-8');

  const message = await createMessage(messageType, messageArgs, ticketId, xsdContent, root, parent);

  if (!message) {
    throw new Error('Message creation failed');
  }

  return new Promise((resolve, reject) => {
    const messageStmt = db.prepare('INSERT INTO messages (data, messageHash, ticketId, parent, verified) VALUES (?, ?, ?, ?, ?)');
    messageStmt.run(message.data.toString('hex'), message.messageHash, ticketId, message.parent, 'unverified', function (err) {
      if (err) {
        return reject(new Error('Failed to insert message'));
      }
      const messageId = this.lastID;

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
          resolve({ message: 'Message created successfully', messageId: messageId, entityIds: results, messageHash: message.messageHash });
        })
        .catch(error => {
          reject(error);
        });
    });
    messageStmt.finalize();
  });
};

exports.updateMessageVerifiedState = (messageId, newState) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('UPDATE messages SET verified = ? WHERE id = ?');
    stmt.run(newState, messageId, function (err) {
      if (err) {
        return reject('Failed to update state');
      }
      if (this.changes === 0) {
        return reject('Message not found');
      }
      resolve();
    });
    stmt.finalize();
  });
};

exports.buildMerkleTree = (ticketId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM messages WHERE ticketId = ?';
    db.all(query, [ticketId], (err, rows) => {
      if (err) {
        return reject(err);
      }
      if (!rows || rows.length === 0) {
        return reject('Messages not found');
      }
      const orderedMessages = orderMessages(rows);
      const messageHashes = orderedMessages.map(obj => [obj.messageHash]);
      const leafEncoding = ['string'];
      const merkleTree = buildMerkleTree(messageHashes, leafEncoding);
      resolve(merkleTree);
    });
  });
};

exports.verifyMessage = (ticketId, messageHash) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM messages WHERE ticketId = ?';
    db.all(query, [ticketId], (err, rows) => {
      if (err) {
        return reject(err);
      }
      if (!rows || rows.length === 0) {
        return reject({ result: false, message: 'Messages not found' });
      }
      const orderedMessages = orderMessages(rows);
      const messageHashes = orderedMessages.map(obj => [obj.messageHash]);
      const leafEncoding = ['string'];
      const merkleTree = buildMerkleTree(messageHashes, leafEncoding);
      const proof = createProof(merkleTree, [messageHash]);
      const result = verifyProof(merkleTree.root, leafEncoding, [messageHash], proof);
      if (!result) {
        return reject({ result: false, message: 'Verification failed: Proof could not be verified' });
      }
      resolve({ result: true, message: 'Proof successfully verified' });
    });
  });
};

exports.getProof = (ticketId, messageHash) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM messages WHERE ticketId = ?';
    db.all(query, [ticketId], (err, rows) => {
      if (err) {
        return reject(err);
      }
      if (!rows || rows.length === 0) {
        return reject({ result: false, message: 'Messages not found' });
      }
      const orderedMessages = orderMessages(rows);
      const messageHashes = orderedMessages.map(obj => [obj.messageHash]);
      const leafEncoding = ['string'];
      const merkleTree = buildMerkleTree(messageHashes, leafEncoding);
      const proof = createProof(merkleTree, [messageHash]);
      resolve(proof);
    });
  });
};

exports.getMessagesForEntity = async (entityName) => {
  try {
    const entityQuery = 'SELECT id FROM entities WHERE name = ?';

    // Fetch the entity ID based on the entity name
    const entity = await new Promise((resolve, reject) => {
      db.get(entityQuery, [entityName], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });

    if (!entity) {
      throw new Error('Entity not found');
    }

    // Fetch the message IDs connected to the entity ID
    const messageEntityQuery = 'SELECT messageId FROM messageEntities WHERE entityId = ?';
    const messageEntities = await new Promise((resolve, reject) => {
      db.all(messageEntityQuery, [entity.id], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    if (messageEntities.length === 0) {
      throw new Error('No messages found for this entity');
    }

    // Extract message IDs
    const messageIds = messageEntities.map(me => me.messageId);

    // Fetch messages connected to the entity
    const messagesQuery = `SELECT * FROM messages WHERE id IN (${messageIds.join(',')})`;
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
    return Object.values(groupedMessages);

  } catch (error) {
    throw new Error(error.message);
  }
};

const insertEntitiesSequentially = async (db) => {
    // Private keys and addresses are only there for testing purposes. Never send any real funds there!
    const entities = [
        {
        name: 'Bank USA',
        address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
        currency: '$'
        },
        {
        name: 'Bank EU',
        address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
        currency: '€'
        },
        {
        name: 'gateway',
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
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

    await insertMessagesSequentially(db);
    await insertMessageEntities(db);
};

const insertMessagesSequentially = async (db) => {
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
  
const insertMessageEntities = async (db) => {
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

module.exports = {
    insertEntitiesSequentially
}
  
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');

const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Populate entities and customers tables
const populateTables = () => {
  const customers = [
    // US Customers
    { bank: 'US Bank', name: 'Alice', iban: 'US64SVBKUS6S1234567890', balance: 20000, currency: '$' },
    { bank: 'US Bank', name: 'Charlie', iban: 'US64SVBKUS6S1234567899', balance: 5000, currency: '$' },
    // EU Customers
    { bank: 'EU Bank', name: 'Bob', iban: 'DE89370400440532013000', balance: 80000, currency: '€' },
    { bank: 'EU Bank', name: 'Diana', iban: 'DE89370400440532013001', balance: 2000, currency: '€' }
  ];

  customers.forEach(customer => {
    const stmt = db.prepare('INSERT INTO customers (bank, name, iban, balance, currency) VALUES (?, ?, ?, ?, ?)');
    stmt.run(customer.bank, customer.name, customer.iban, customer.balance, customer.currency, function (err) {
      if (err) {
        console.error('Error inserting customer:', err);
      }
    });
    stmt.finalize();
  });
};

// Populate tables on server start
populateTables();

app.get('/', (req, res) => {
  res.send('Bank Server');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
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

// Route to get all customers
app.get('/customers', (req, res) => {
  db.all('SELECT * FROM customers', [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send(rows);
  });
});

// Route to add a new customer
app.post('/customers', (req, res) => {
  const { entityId, name, balance } = req.body;

  const stmt = db.prepare('INSERT INTO customers (entityId, name, iban, balance) VALUES (?, ?, ?, ?)');
  stmt.run(entityId, name, balance, function (err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(201).send({ customerId: this.lastID });
  });
  stmt.finalize();
});

// Route to update customer balance
app.put('/customers/:id/balance', (req, res) => {
  const customerId = req.params.id;
  const { newBalance } = req.body;

  if (typeof newBalance !== 'number') {
    return res.status(400).send('New balance must be a number');
  }

  const stmt = db.prepare('UPDATE customers SET balance = ? WHERE id = ?');
  stmt.run(newBalance, customerId, function(err) {
    if (err) {
      return res.status(500).send('Failed to update balance');
    }
    if (this.changes === 0) {
      return res.status(404).send('Customer not found');
    }
    res.status(200).send('Balance updated successfully');
  });
  stmt.finalize();
});

app.get('/transactions', (req, res) => {
  db.all('SELECT * FROM transactions', [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send(rows);
  });
});

app.post('/transactions', (req, res) => {
  const { messageId, sender, receiver, amount, status } = req.body;

  const stmt = db.prepare('INSERT INTO transactions (messageId, sender, receiver, amount, status) VALUES (?, ?, ?, ?, ?)');
  stmt.run(messageId, sender, receiver, amount, status, function (err) {
      if (err) {
      return res.status(500).send(err.message);
      }
      res.status(201).send({ transactionId: this.lastID });
  });
  stmt.finalize();
});

app.put('/transactions/:id/status', (req, res) => {
  const transactionId = req.params.id;
  const { newStatus } = req.body;

  if (typeof newStatus !== 'string') {
      return res.status(400).send('New status must be a string');
  }

  const stmt = db.prepare('UPDATE transactions SET status = ? WHERE id = ?');
  stmt.run(newStatus, transactionId, function(err) {
      if (err) {
      return res.status(500).send('Failed to update status');
      }
      if (this.changes === 0) {
      return res.status(404).send('Transaction not found');
      }
      res.status(200).send('Status updated successfully');
  });
  stmt.finalize();
});
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./utils/database');
const { insertEntitiesSequentially } = require('./utils/setup');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Insert initial data into the database
insertEntitiesSequentially(db).then(() => {
    console.log('Database initialized with initial data.');
}).catch(err => {
    console.error('Error initializing database:', err);
});

// Routes
const messageRoutes = require('./routes/messages');
const entityRoutes = require('./routes/entities');
const messageEntitiesRoutes = require('./routes/messageEntities');
const contractRoutes = require('./routes/contracts');

app.use('/messages', messageRoutes);
app.use('/entities', entityRoutes);
app.use('/messageEntities', messageEntitiesRoutes);
app.use('/contracts', contractRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;

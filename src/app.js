const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');

const config = require('./config');
const rideController = require('./controllers/ride-controller');
const userController = require('./controllers/user-controller');
const authController = require('./controllers/auth-controller');
const searchController = require('./controllers/search-controller');

/* Get an Express app instance */
const app = express();

/* Set up CORS */
app.use(cors());

/* Set up request logging */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

/* Conncet to the database */
mongoose.connect(config.db_uri, { useMongoClient: true });

/* Declare our routes */
app.use('/api/rides', rideController);
app.use('/api/users', userController);
app.use('/api/auth', authController);
app.use('/api/search', searchController);

module.exports = app;

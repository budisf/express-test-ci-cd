const _ = require('underscore');

const express = require('express');

const router = express.Router();
const bodyParser = require('body-parser');

const User = require('../models/user');
const authMiddleWare = require('../middleware/auth-middleware');

router.use(bodyParser.json());

if (process.env.NODE_ENV !== 'test') {
  router.use(authMiddleWare);
}

/**
 * Find a user by ID.
 */
router.get('/:user_id', (req, res) => {
  console.log(`Finding user with id ${req.params.user_id}`);

  if (req.params.user_id === 'null' || req.params.user_id === 'undefined') {
    console.log('Invalid user_id format');
    return res.status(404).send('Invalid user_id format');
  }
  console.log("Finding based off of " + req.params.user_id);
  console.log("Params: " + req.params);
  User.findById(req.params.user_id, (err, user) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Internal Error');
    }
    if (!user) {
      console.log(`Could not find user with id ${req.params.user_id}`);
      return res.status(404).send('Could not find user by ID.');
    }
    console.log("User found");
    return res.status(200).send(user);
  });
});

/**
 * Create a user based on the parameters passed in
 */
router.post('/', (req, res) => {
  User.findOne({ username: req.body.username }, (err, user) => {
    if (err) return res.status(500);
    if (!res) return res.status(404);
    if (user) return res.status(403).send('403');
    User.create({
      username: req.query.username,
      first_name: req.query.first_name || req.query.username,
      last_name: req.query.last_name || '',
      email: req.query.email || `${req.query.username}@rice.edu`,
      phone: req.query.phone || '',
    }, (writeErr, writeUser) => {
      if (writeErr) return res.status(500);
      return res.status(200).send(writeUser);
    });
    return 0;
  });
});

/**
 * Delete a user from their ID
 */
router.delete('/:user_id', (req, res) => {
  User.findById(req.params.user_id, (err, user) => {
    console.log('Deleting user with id', req.params.user_id);
    if (err) {
      console.log(err);
      return res.status(500).send('Internal Error');
    }
    if (!user) {
      console.log(`Could not find user with id ${req.params.user_id}`);
      return res.status(404).send('Could not find user by ID.');
    }

    // User was found. Remove the user.
    User.remove({
      _id: user._id,
    }, (removeErr) => {
      if (removeErr) {
        console.log(removeErr);
        return res.status(500).send('Internal Error');
      }
      return res.status(200).send('Success');
    });
    return 0;
  });
});

/**
 * Edit a user's profile based on their ID.
 */
router.put('/:user_id/edit', (req, res) => {
  console.log(`Updating user with id ${req.params.user_id} with new profile`);
  User.findById(req.params.user_id, (err, user) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Internal Error');
    }
    if (!user) {
      console.log(`Could not find user with id ${req.params.user_id}`);
      return res.status(404).send('Could not find user by ID.');
    }

    // Extend the user (copies values from req.body onto user) and save it if req is sent by a valid user.
    if (!(Object.keys(req.body).every(prop => User.schema.paths.hasOwnProperty(prop)))) {
      console.log('Object does not match DB format');
      return res.status(400).send('Given object does not match DB format.');
    }

    user = _.extend(user, req.body);
    user.save((saveErr, savedUser) => {
      if (err) {
        console.log(err);
        return res.status(500).send('Internal Error');
      }
      if (!savedUser) {
        console.log('Could not save user profile');
        return res.status(404).send('Could not save new user profile.');
      }
      return res.status(200).send(user);
    });
  });

  return 0;
});

module.exports = router;

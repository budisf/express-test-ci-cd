const express = require('express');

const router = express.Router();
const bodyParser = require('body-parser');
const Ride = require('../models/ride');
const authMiddleWare = require('../middleware/auth-middleware');

router.use(bodyParser.json());

if (process.env.NODE_ENV !== 'test') {
  router.use(authMiddleWare);
}

router.get('/', (req, res) => {
  // Add all the parameters to our query object
  const query = {};
  if (req.query.departing_from) {
    query.departing_from = req.query.departing_from;
  }
  if (req.query.arriving_at) {
    query.arriving_at = req.query.arriving_at;
  }

  Ride.find(query, (err, rides) => {
    if (err) {
      return res.status(500);
    }

    // Filter the query by time
    if (req.query.departure_date) {
      const departureDate = new Date(req.query.departure_date);
      return res.status(200).send(rides.filter((ride) => {
        // Look for rides with the same year, month, and day
        const rideDate = new Date(ride.departing_datetime);
        return (rideDate.getUTCFullYear() === departureDate.getUTCFullYear()) &&
          (rideDate.getUTCMonth() === departureDate.getUTCMonth()) &&
          (rideDate.getUTCDate() === departureDate.getUTCDate());
      }));
    }
    return res.status(200).send(rides);
  });
});

module.exports = router;

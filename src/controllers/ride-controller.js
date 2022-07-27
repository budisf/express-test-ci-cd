const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const bodyParser = require('body-parser');

const Ride = require('../models/ride');
const User = require('../models/user');
const authMiddleWare = require('../middleware/auth-middleware');
const ObjectId = require('mongodb').ObjectId;

const nodemailer = require('nodemailer');

var mongoose = require('mongoose');
const agenda = require('../agenda');

router.use(bodyParser.json());

if (process.env.NODE_ENV !== 'test') {
    router.use(authMiddleWare);
}

const includes = (array, username) => {
    for (let i = 0; i < array.length; i += 1) {
        if (array[i].username === username) return true;
    }
    return false;
};


/**
 * Returns all rides.
 */
router.get('/', (request, response) => {
    // 'find' returns all objects matching the given query - and all objects match the empty query "{}".

    // Most db operations take a function as their second argument, which is called after the query completes. This
    // function executes after the operation finishes - if there's an error, the first argument (err) is true. If not,
    // the second argument (rides) contains our results.
    Ride.find({}, (err, rides) => {
        if (err) {
            return response.status(500); // db error (500 internal server error)
        }
        if (!rides) {
            return response.status(404); // not found (404 not found)
        }
        response.status(200).send(rides); // success - send the rides!
    });
});

/**
 * Get a single ride
 */
router.get('/:ride_id', (req, res) => {
    Ride.findById(req.params.ride_id, (err, ride) => {
        if (err) res.status(500);
        if (!ride) res.status(404);
        res.status(200).send(ride);
    });
});

/**
 * Helper function to get past rides
 * @param callback
 */
function pastrides(callback) {
    const currentTime = Date.now();
    Ride.find({ departing_datetime: { $lt: currentTime } }, (err, rides) => {
        callback(err, rides);
    });
}

/**
  Get all past rides.
*/
router.get('/past/all/', (req, res) => {
    // TODO: figure out query & comparison time

    pastrides((err, rides) => {
        if (err) {
            console.log('Getting past rides: db error 500');
            return res.status(500); // db error (500 internal server error)
        }
        if (!rides) {
            console.log('Getting past rides: not found 404');
            return res.staus(404); // not found (404 not found)
        }
        console.log('Getting past rides: rides round D:<');
        res.status(200).send(rides);
    });
});

/**
 * Get all past rides for a specific user.
 */
router.get('/past/user/:user_id', (req, res) => {
    const currentTime = new Date().getTime();

    console.log(`Getting all past rides for user ${req.params.user_id}`);

    if (req.params.user_id === 'null' || req.params.user_id === 'undefined') {
        console.log('Invalid user_id format');
        return res.status(404).send('Invalid user_id format');
    }

    User.findById(req.params.user_id, (err, user) => {
        if (err) {
            console.log(err);
            return res.status(500); // db error (500 internal server error)
        }
        if (!user) {
            console.log(`Could not find user with id ${req.params.user_id}`);
            return res.status(404).send('Could not find user by ID.');
        }

        // currentuser is an ARRAY containing one element - the user object.
        const currentuser = user;

        // find all rides whose "riders" array contains all the elements in the "currentuser" array - technically
        // only one user.
        const query = { $and: [{ riders: { $all: currentuser } }, { departing_datetime: { $lt: currentTime } }] };

        Ride.find(query, (err, rides) => {

            if (err) {
                return res.status(500); // db error (500 internal server error)
            }
            if (!rides) {
                return res.status(404); // not found (404 not found)
            }
            res.status(200).send(rides);
        });
    });
});

/**
 * Get all rides occurring in the future
 */
router.get('/future/all/', (req, res) => {
    // TODO: figure out query & comparison time

    futurerides((err, rides) => {
        if (err) {
            return res.status(500); // db error (500 internal server error)
        }
        if (!rides) {
            return res.staus(404); // not found (404 not found)
        }
        res.status(200).send(rides);
    });
});

/**
 * Get all future rides
 * @param callback
 */
function futurerides(callback) {
    const currentTime = Date.now();
    Ride.find({ departing_datetime: { $gte: currentTime } }, (err, rides) => {
        callback(err, rides);
    });
}

/**
 * Get all future rides for a specific user
 */
router.get('/future/user/:user_id', (req, res) => {
    const currentTime = new Date().getTime();

    console.log(`Getting all future rides for user ${req.params.user_id}`);

    if (req.params.user_id === 'null' || req.params.user_id === 'undefined') {
        console.log('Invalid user_id format');
        return res.status(404).send('Invalid user_id format');
    }

    User.findById(req.params.user_id, (err, user) => {
        if (err) {
            console.log(err);
            return res.status(500); // db error (500 internal server error)
        }
        if (!user) {
            console.log(`Could not find user with id ${req.params.user_id}`);
            return res.status(404).send('Could not find user by ID.');
        }

        // currentuser is an ARRAY containing one element - the user object.
        const currentuser = user;

        // find all rides whose "riders" array contains all the elements in the "currentuser" array - technically
        // only one user.
        const query = { $and: [{ riders: { $all: currentuser } }, { departing_datetime: { $gte: currentTime } }] };

        Ride.find(query, (err, rides) => {
            if (err) {
                return res.status(500); // db error (500 internal server error)
            }
            if (!rides) {
                return res.status(404); // not found (404 not found)
            }
            res.status(200).send(rides);
        });
    });
});

/**
 * Get all rides containing the user
 */
router.get('/user/:user', (req, res) => {
    const currentTime = new Date().getTime();

    User.find({ username: req.params.user }, (err, user) => {
        if (err) {
            return res.status(500); // db error (500 internal server error)
        }

        // currentuser is an ARRAY containing one element - the user object.
        const currentuser = user;

        // find all rides whose "riders" array contains all the elements in the "currentuser" array - technically
        // only one user.
        const query = { riders: { $all: currentuser } };

        Ride.find(query, (err, rides) => {
            //console.log('Rides', rides);

            if (err) {
                return res.status(500); // db error (500 internal server error)
            }
            if (!rides) {
                return res.status(404); // not found (404 not found)
            }

            res.status(200).send(rides);
        });
    });
});

/**
 * Post a single ride.
 */
router.post('/', (req, res) => {

    console.log(`Creating a new ride with user ${req.body.user_id}`);

    if (req.params.user_id === 'null' || req.params.user_id === 'undefined') {
        console.log('Invalid user_id format');
        return res.status(404)
            .send('Invalid user_id format');
    }

    User.findById(req.body.user_id, (err, user) => {
        if (err) {
            console.log(err);
            res.status(500)
                .send();
        }
        if (!user) {
            console.log(`Could not find user with id ${req.body.user_id}`);
            return res.status(404)
                .send('Could not find user by ID.');
        }

        Ride.create({
            departing_datetime: req.body.ride.departing_datetime,
            arriving_at: req.body.ride.arriving_at,
            departing_from: req.body.ride.departing_from,
            number_riders: req.body.ride.number_riders,
            comments_input: req.body.ride.comments_input,
            riders: [user._id],
        }, (err, ride) => {
            if (err) return res.status(500)
                .send();

            console.log("Ride creation: " + ride);

            var id = String(ride._id);
            var ridersStringAry = [user.email];

            // 1 day in milliseconds: 86400000
            // Date object
            var sendTime = new Date(ride.departing_datetime - 86400000);
            // get current time
            const currentTime = Date.now();

            if (sendTime > currentTime) {
                console.log("Scheduling job");
                agenda.schedule(sendTime, "send future email", {
                    ride_id: id,
                    to: ridersStringAry
                });
            } else {
                console.log("Not sending an email because the ride is in 24 hours.");
            }

            console.log("Ride id: %s and Riders: %s", id, ridersStringAry);
            sendEmailConfirmation(id, ride, user, true, false, false, false);


            res.status(200).send(ride);
        });
    });
});

/**
 * Post a user to a ride.
 */
router.post('/:ride_id/book', (req, res) => {
    console.log(`Posting user with id ${req.body.user_id} to ride with id ${req.params.ride_id}`);

    if (req.params.user_id === 'null' || req.params.user_id === 'undefined') {
        console.log('Invalid user_id format');
        return res.status(404).send('Invalid user_id format');
    }

    if (!req.body.user_id) {
        console.log('A user id was not provided');
        return res.status(404).send('A user must be provided.');
    }

    User.findById(req.body.user_id, (err, user) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Internal Error');
        }
        if (!user) {
            console.log(`Could not find user with id ${req.body.user_id}`);
            return res.status(404).send('Could not find user by ID.');
        }

        Ride.findById(req.params.ride_id, (rideErr, ride) => {
            if (rideErr) {
                console.log(rideErr);
                return res.status(500).send('Internal Error');
            }
            if (!ride) {
                console.log(`Could not find ride with id ${req.params.ride_id}`);
                return res.status(404).send('Could not find ride by ID');
            }

            console.log(ride.riders);
            if (includes(ride.riders, user._id)) {
                console.log('User already exists on ride');
                return res.status(403).send('User exists on ride');
            } else {
                ride.riders.push(user);
                const newRiders = ride.riders;
                ride.set({ riders: newRiders });
                ride.save((saveErr, newRide) => {
                    console.log("lul, error is null? " + saveErr);
                    if (saveErr) {
                        console.log(saveErr);
                        return res.status(500).send('Error saving user into ride');
                    }

                    // send email
                    sendEmailConfirmation(req.params.ride_id, ride, user, false, true, false, false);
                    updateJob(true, user.email, req.params.ride_id);
                    return res.status(200).send(newRide);
                });
            }
        });
    });
});

/**
 * Delete a user from a ride.
 */
router.delete('/:ride_id/:user_id', (req, res) => {
    if (req.params.user_id === 'null' || req.params.user_id === 'undefined') {
        console.log('Invalid user_id format');
        return res.status(404).send('Invalid user_id format');
    }

    // Get the ride
    Ride.findById(req.params.ride_id, (err, ride) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal Error');
        }
        if (!ride) {
            console.log(`Could not find ride with id ${req.params.ride_id}`);
            return res.status(404).send('Could not find ride by ID');
        }

        // If this ride is already empty - delete it. It should not be in this kind of state.
        if (ride.riders && !ride.riders.length) {
            deleteRide(req.params.ride_id, (err, res) => {
                if (err) { return res.status(500).send(); }
                console.log('ride ', req.params.ride_id, ' was already empty and successfully deleted');
            });
        }

        // Check if the user is part of this ride
        // Remove the user from this ride
        console.log(req.params.user_id);
        console.log(ride.riders);
        if (ride.riders.some(r => r._id.toString() === req.params.user_id.toString())) {

            ride.riders = ride.riders.filter(ele => ele._id.toString() !== req.params.user_id.toString());
            console.log('removed user id ', req.params.user_id, 'from ride', req.params.ride_id);

            // If this ride has no users - delete it
            if (ride.riders && ride.riders.length === 0) {
                deleteRide(req.params.ride_id, (err, response) => {
                    if (err) { return res.status(500).send(); }

                    User.findById(req.params.user_id, (err, user) => {
                        console.log("User: " + user);
                        console.log("User email: " + user.email);
                        if (err) {
                            // console.log("500 error for finding user: " + err)
                            res.status(500).send();
                        }
                        if (!user) res.status(404).send();

                        sendEmailConfirmation(req.params.ride_id, ride, user, false, false, false, true);
                        console.log('ride ', req.params.ride_id, ' is now empty and successfully deleted');
                        res.status(200).send(ride);
                    });
                });
            } else {
                // Write the changes to the database
                ride.save((saveErr) => {
                    if (saveErr) return res.status(500).send();

                    User.findById(req.params.user_id, (err, user) => {
                        console.log("User: " + user);
                        console.log("User email: " + user.email);
                        if (err) {
                            // console.log("500 error for finding user: " + err)
                            res.status(500).send();
                        }
                        if (!user) res.status(404).send();

                        updateJob(false, user.email, req.params.ride_id);
                        sendEmailConfirmation(req.params.ride_id, ride, user, false, false, true, false);
                    });

                    return res.status(200).send(ride);
                });
            }
        } else {
            console.log('User does not exist on this ride!');
            return res.status(404).send('User does not exist on ride!');
        }
    });
});

/**
 * Endpoint Delete a ride.
 */
router.delete('/:ride_id', (req, res) => {
    console.log('deleting ride ', req.params.ride_id);
    deleteRide(req.params.ride_id, (err, ride) => {
        if (err) { return res.status(500).send(); }
        console.log('ride ', req.params.ride_id, ' was successfully deleted');
        ride.status(200).send(ride);
    });
});

/**
 * Delete a ride
 */
function deleteRide(ride_id, callback) {
    const myquery = { _id: ride_id };

    deleteJob(ride_id);
    Ride.deleteOne(myquery, (err, res) => {
        callback(err, res);
    });
}

/**
 * Deletes job.
 * @param ride_id
 */
function deleteJob(ride_id) {
    agenda.cancel({ "data.ride_id" : ride_id }, (err, numRemoved) => {
        if (err) {
            console.log("500 error for finding ride: " + err);
            res.status(500).send();
        }
        else {
            console.log("Number of CANCELLED jobs: " + numRemoved);
        }
    });
}

/**
 * Updates a the mailing list and timing of a job.
 * @param add: boolean representing whether the email should be added/removed to/from the mailing list
 * @param email: email address string
 * @param ride_id: ride id of the ride
 */
function updateJob(add, email, ride_id) {
    console.log("Updating job");


    var time;

    // Find the job matching the ride_id to get the time.
    async function main() {

        console.log("Ride id: %s", ride_id);

        ride_id = String(ride_id);
        const jobs = await agenda.jobs({ "data.ride_id" : ride_id});
        console.log("Jobs: " + jobs);

        if(jobs.length === 0) {
            console.log("There are no jobs that match the query.");
        }

        else {

            if (add) {
                jobs[0].attrs.data.to.push(email);
            } else {
                jobs[0].attrs.data.to = jobs[0].attrs.data.to.filter(sendtoMe => sendtoMe!==email);
            }

            console.log("riders: %s", jobs[0].attrs.data.to);
            jobs[0].save();
            console.log("successfully updated")
        }
    }

    main().catch(console.error);
}

/**
 * Send an immediate email.
 * @param ride_id: Ride ID
 * @param ride: Ride object
 * @param rider: "Special" rider receiving the personalized message
 * @param createdRide: Boolean, true if the triggering action was a ride creation
 * @param joinedRide: Boolean, true if the triggering action was someone joining a ride
 * @param leftRide: Boolean, true if the triggering action was someone leaving a ride
 */
function sendEmailConfirmation(ride_id, ride, rider, createdRide, joinedRide, leftRide, deletedRide) {

    console.log("sending Email Confirmation");

    var departingFrom = ride.departing_from;
    var arrivingAt = ride.arriving_at;
    var date = ride.departing_datetime;
    var localeDate = date.toLocaleDateString([], {
        timeZone:'America/Chicago'
    });
    var localeTime = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute:'2-digit',
        timeZone:'America/Chicago',
        timeZoneName: 'long'
    });
    var emailString = '';
    var riderString = '<h4>Riders (' + ride.riders.length + ')</h4><ul>'
    var newRider = '';

    if (!rider.first_name)
        newRider = rider.username;

    else newRider = rider.first_name + " " + rider.last_name;

    console.log("New Rider: %s", newRider);

    if (createdRide) {
        riderString = '';
    } else {

        var i;
        for (i = 0; i < ride.riders.length; i++) {
            var temp = ride.riders[i];

            // if the user is joining a ride, make sure they don't get 2 emails.
            if (temp.username !== rider.username)
                emailString += temp.email + ', ';

            // Use the full name of the rider for riders list, or the rider's username if not available.
            if (!temp.first_name)
                riderString += '<li>' + temp.username + '</li>';
            else riderString += '<li>' + temp.first_name + ' ' + temp.last_name + '</li>';
        }

        riderString += '</ul>';
    }


    // Use the flags to determine which type of message to send.
    var subject;
    var message;
    var personalSubject;
    var personalMessage;
    var link = '\"https://carpool.riceapps.org/rides/' + ride_id + '\"';
    var messageBody = "<p>The ride's information is now as follows: </p>" +
        '<p><b>Departing from</b>: ' + departingFrom + '</p>' +
        '<p><b>Arriving at</b>: ' + arrivingAt + '</p>' +
        '<p><b>Departure time</b>: ' + localeDate + ' ' + localeTime + '</p>' +
        riderString;
    if (!deletedRide)
        messageBody += '<br/><p> To view the ride page, <a href = ' + link + '>click here</a>.</p>';

    if (createdRide) {
        personalSubject = 'You have created a ride to ' + arrivingAt + ' on ' + localeDate;
        personalMessage = 'You have created a ride from ' + departingFrom + ' to ' + arrivingAt + ' on ' + localeDate + '!';
    }

    if (joinedRide) {
        subject = 'User ' + newRider + ' has joined your ride to ' + arrivingAt + ' on ' + localeDate + '!';
        message = '<p>User ' + newRider + ' has joined your ride. </p>';
        personalSubject = 'You have joined a ride to ' + arrivingAt + ' on ' + localeDate;
        personalMessage = 'You have joined a ride from ' + departingFrom + ' to ' + arrivingAt + ' on ' + localeDate + '!';
    }

    if (leftRide) {
        subject = 'User ' + newRider + ' has left your ride!';
        message = '<p>User ' + newRider + ' has left your ride. </p>';
        personalSubject = 'You have left a ride to ' + arrivingAt + ' on ' + localeDate;
        personalMessage = 'You have left a ride from ' + departingFrom + ' to ' + arrivingAt + ' on ' + localeDate + '!';
    }

    if (deletedRide) {
        personalSubject = 'You have left a ride to ' + arrivingAt + ' on ' + localeDate;
        personalMessage = 'You have left a ride from ' + departingFrom + ' to ' + arrivingAt + ' on ' + localeDate + '! ' +
        'Because you were the only person previously in this ride, the ride has been deleted.';
        messageBody = "<p>The ride's information was previously as such: </p>" +
            '<p><b>Departing from</b>: ' + departingFrom + '</p>' +
            '<p><b>Arriving at</b>: ' + arrivingAt + '</p>' +
            '<p><b>Departure time</b>: ' + localeDate + ' ' + localeTime + '</p>';
    }

    async function main(){

        // create reusable transporter object using the default SMTP transport
        let smtpTransport = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                type: 'OAuth2',
                user: 'carpool.riceapps@gmail.com', // generated ethereal user
                clientId: '859237922889-smeosvsfknkhm31sirfdt0afnspc4s64.apps.googleusercontent.com',
                clientSecret: 'aGISyb3daSQF1HFVqKFe5Nho',
                refreshToken: '1/o1N0caKIPFpdy02pn0qxgwcmpV9KbUyOEL9Jox7RmQQ',
                accessToken: 'ya29.GludBu475Z82VtLhBWgQNgkIPbVG27l1VrOeFrcrA8Cz1TWuraNc24Q2nAx2GedXezdP0qEJVF2Zw_87hHNsGlra8dJSWjEV9MfOjuOouX4Ly2k1RtENNHaTyU0v'
            }
        });

        // To all the riders on the ride
        if (!createdRide && !deletedRide)
        {

            let mailOptions = {
                from: "Rice Carpool <carpool.riceapps@gmail.com>", // sender address
                to: emailString, // list of receivers
                subject: subject, // Subject line
                html: message + messageBody
            };

            let info = await smtpTransport.sendMail(mailOptions);
            console.log("Message sent: %s", info.messageId);
        }


        // To the user.
        let mailOptions2 = {
            from: "Rice Carpool <carpool.riceapps@gmail.com>", // sender address
            to: rider.email, // list of receivers
            subject: personalSubject, // Subject line
            html: personalMessage + messageBody
        };

        // send mail with defined transport object
        let info2 = await smtpTransport.sendMail(mailOptions2);
        console.log("Message sent to rider: %s", info2.messageId);

    }

    main().catch(console.error);
}

module.exports = router;

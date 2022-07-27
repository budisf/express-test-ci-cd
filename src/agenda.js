var express = require('express');

var Agenda = require('agenda');
var config = require('./config');
var nodemailer = require('nodemailer');

var mongoConnectionString = config.db_uri;
var agenda = new Agenda({db: {address: mongoConnectionString, collection: 'jobs'}});
var Ride = require('./models/ride');
agenda.start();


agenda.define('send future email', (job, done) => {
    createEmailReminderJob(job.attrs.data);
    done();
});

agenda.on('start', job => {
    console.log('Job \"%s\" starting with id %s and email %s at time %s', job.attrs.name, job.attrs.data.ride_id, job.attrs.data.to, job.attrs.lastRunAt);
});
agenda.on('complete', job => {
    console.log(`Job ${job.attrs.name} finished`);
    job.remove(err => {
        if (!err) {
            console.log('Successfully removed job from collection');
        }
    });
});
agenda.on('success:send future email', job => {
    console.log(`Sent Email Successfully`);
});
agenda.on('fail:send future email', (err, job) => {
    console.log('Job failed with error: '+ err.message);
});

/**
 *
 * @param data: Object containing ride ID and list of riders
 */
function createEmailReminderJob(data) {


    Ride.findById(data.ride_id, (err, ride) => {
        if (err) console.log(err);
        if(!ride) console.log("Ride not found.");

        else {
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
            var riderString = '<h4>Riders (' + ride.riders.length + ')</h4><ul>'

            var i;
            for (i = 0; i < ride.riders.length; i++) {
                var temp = ride.riders[i];

                // Use the full name of the rider for riders list, or the rider's username if not available.
                if (!temp.first_name)
                    riderString += '<li>' + temp.username + '</li>';
                else riderString += '<li>' + temp.first_name + ' ' + temp.last_name + '</li>';
            }

            riderString += '</ul>';


            var link = '\"https://carpool.riceapps.org/rides/' + data.ride_id + '\"';
            var messageBody = "<p>Your ride to " + arrivingAt + " in 24 hours!</p>" +
                "<p>The ride's information is as follows: </p>" +
                '<p><b>Departing from</b>: ' + departingFrom + '</p>' +
                '<p><b>Arriving at</b>: ' + arrivingAt + '</p>' +
                '<p><b>Departure time</b>: ' + localeDate + ' ' + localeTime + '</p>' +
                riderString +
                '<br/><p> To view the ride page, <a href = ' + link + '>click here</a>.</p>';

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

                let emailString = "";
                for (var i = 0; i < data.to.length; i ++) {
                    emailString += data.to[i] + ", ";
                }
                console.log("Email Receivers: %s", emailString);

                let mailOptions = {
                    from: "Rice Carpool <carpool.riceapps@gmail.com>", // sender address
                    to: emailString, // list of receivers
                    subject: "Your ride to " + arrivingAt + " in 24 hours!", // Subject line
                    html: messageBody
                };

                let info = await smtpTransport.sendMail(mailOptions);
                console.log("Message sent: %s", info.messageId);

            }

            main().catch(console.error);
        }

    });
}

module.exports = agenda;

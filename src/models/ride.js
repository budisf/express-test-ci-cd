var mongoose = require('mongoose');

/**
 * Declare our schema for a Ride.
 */
var RideSchema = new mongoose.Schema({
  departing_datetime: Date,
  departing_from: String,
  arriving_at: String,
  number_riders: String,
  comments_input: String,

  /* for owner and rider, we need to tell MongoDB to reference the User model here. */
  owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  riders: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],

  /* NEW: notes section for personal message from the ride creator */
  note: String,


  /* Below are currently unused */
  title: String,
  description: String,
  spots: Number,
  cost: Number,
  vehicle_type: String,
  departure_address: String,
  arrival_address: String,
  /* Example: { departure_location: { "type": "Point", "coordinates": [0.0, 0.0] } */
  departure_location: {type: String, coordinates: [Number]}, // [longitude, latitude]
  arrival_location: {type: String, coordinates: [Number]} // [longitude, latitude]
});


/**
 * The owner and riders fields only contain IDs that reference the User objects, not the actual object. Before we send
 * our Ride object, we need to 'populate' these fields with their actual User objects.
 * This is a type of 'middleware.'
 *
 * @param next is a function passed in by mongoose that we need to call after we do our population.
 */
var autoPopulate = function (next) {
  this.populate('owner');
  this.populate('riders');
  next();
};

/**
 * Plug in our middleware we defined above to run before the specified operations.
 */
RideSchema.pre('find', autoPopulate);
RideSchema.pre('findOne', autoPopulate);
RideSchema.pre('save', autoPopulate);

/**
 * Declare the model.
 */
module.exports = mongoose.model('Ride', RideSchema);

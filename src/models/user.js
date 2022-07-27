const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  first_name: String,
  last_name: String,
  email: String,
  phone: String,
});

mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');

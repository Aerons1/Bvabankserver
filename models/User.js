const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  accountNumber: String,
  balance: { type: Number, default: 0 },
  accountManager: {
    name: String,
    email: String,
  },
  isBlocked: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, lowercase: true, required: true },
  phone: String,
  dob: Date,
  ssnLast4: String,
  address: String
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);

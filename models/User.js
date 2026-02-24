const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: false, select: false },
  role: { type: String, enum: ['admin', 'user', 'developer', 'fieldhand'], default: 'user' },
  defaultLeague: { type: String, default: 'Rochester' },
  mustChangePassword: { type: Boolean, default: false },      // Force password change on next local login
  preferences: { type: mongoose.Schema.Types.Mixed, default: {} }, // Per-user app config & column prefs
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

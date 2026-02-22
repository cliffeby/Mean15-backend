/**
 * One-time script: creates (or resets) a local admin user.
 * Usage:  node scripts/seed-admin.js
 *
 * Set ADMIN_EMAIL / ADMIN_PASSWORD env vars to override defaults, or just
 * edit the constants below.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@roch.local';
const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe1!';
const ADMIN_ROLE     = 'developer';   // highest local role

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to DB');

  let user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

  if (user) {
    // Reset the password and escalate role
    user.password = ADMIN_PASSWORD;   // pre-save hook will bcrypt this
    user.role = ADMIN_ROLE;
    user.mustChangePassword = false;
    await user.save();
    console.log(`Updated existing user: ${ADMIN_EMAIL}  role=${ADMIN_ROLE}`);
  } else {
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: ADMIN_ROLE,
      mustChangePassword: false,
    });
    console.log(`Created admin user: ${ADMIN_EMAIL}`);
  }

  console.log(`\nCredentials\n  email:    ${ADMIN_EMAIL}\n  password: ${ADMIN_PASSWORD}`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });

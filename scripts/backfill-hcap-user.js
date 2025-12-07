/* Backfill script for HCap.user and HCap.username
 * Usage: node scripts/backfill-hcap-user.js
 * It will connect to MONGODB_URI and populate any HCap documents that have userId set
 * but missing user/username fields, using User.name or User.email.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const HCap = require('../models/HCap');
const User = require('../models/User');

async function backfill() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mean15b';
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri, {});

  try {
    const cursor = HCap.find({ userId: { $exists: true, $ne: null }, $or: [{ user: { $exists: false } }, { username: { $exists: false } }] }).cursor();
    let count = 0;
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      try {
        const uid = doc.userId;
        if (!uid) continue;
        const user = await User.findById(uid).select('name email');
        if (!user) continue;
        const userStr = user.name || user.email || '';
        const update = {};
        if (!doc.user) update.user = userStr;
        if (!doc.username) update.username = userStr;
        if (Object.keys(update).length > 0) {
          await HCap.findByIdAndUpdate(doc._id, update);
          count++;
          console.log('Updated HCap', doc._id, 'with', update);
        }
      } catch (err) {
        console.warn('Error processing doc', doc._id, err);
      }
    }
    console.log('Backfill complete. Updated docs:', count);
  } catch (err) {
    console.error('Backfill failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

backfill().catch(err => {
  console.error(err);
  process.exit(1);
});
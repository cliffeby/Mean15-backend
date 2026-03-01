/* backfill-member-rochIndex.js
 * Sets rochIndex = handicap on every Member document that has a handicap
 * value but is missing rochIndex (or has rochIndex = null).
 *
 * Usage: node scripts/backfill-member-rochIndex.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Member = require('../models/Member');

async function backfill() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mean15b';
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri);

  try {
    const docs = await Member.find({
      handicap: { $exists: true, $ne: null },
      $or: [{ rochIndex: { $exists: false } }, { rochIndex: null }],
    }).lean();

    console.log(`Found ${docs.length} members to update`);

    let updated = 0;
    let skipped = 0;

    for (const doc of docs) {
      try {
        await Member.findByIdAndUpdate(doc._id, { rochIndex: doc.handicap });
        updated++;
        console.log(`Updated member ${doc._id} (${doc.firstName} ${doc.lastName || ''}) rochIndex = ${doc.handicap}`);
      } catch (err) {
        console.warn('Error updating doc', doc._id, err);
        skipped++;
      }
    }

    console.log(`\nBackfill complete. Updated: ${updated}, Skipped/errored: ${skipped}`);
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

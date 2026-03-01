/* backfill-hcap-usgaIndexAfterTodaysScore.js
 * Copies usgaIndexForTodaysScore → usgaIndexAfterTodaysScore on HCap documents
 * that have the old field but are missing the new one (or have it null).
 * Also unsets the old field after copying.
 *
 * Usage: node scripts/backfill-hcap-usgaIndexAfterTodaysScore.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const HCap = require('../models/HCap');

async function backfill() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mean15b';
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri);

  try {
    const docs = await HCap.find({
      usgaIndexForTodaysScore: { $exists: true, $ne: null },
      $or: [{ usgaIndexAfterTodaysScore: { $exists: false } }, { usgaIndexAfterTodaysScore: null }],
    }).lean();

    console.log(`Found ${docs.length} HCap records to migrate`);

    let updated = 0;
    let skipped = 0;

    for (const doc of docs) {
      try {
        await HCap.findByIdAndUpdate(doc._id, {
          $set: { usgaIndexAfterTodaysScore: doc.usgaIndexForTodaysScore },
          $unset: { usgaIndexForTodaysScore: '' },
        });
        updated++;
        console.log(`Migrated HCap ${doc._id} (${doc.name || ''}) usgaIndexAfterTodaysScore = ${doc.usgaIndexForTodaysScore}`);
      } catch (err) {
        console.warn('Error updating doc', doc._id, err);
        skipped++;
      }
    }

    console.log(`\nMigration complete. Updated: ${updated}, Skipped/errored: ${skipped}`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

backfill().catch(err => {
  console.error(err);
  process.exit(1);
});

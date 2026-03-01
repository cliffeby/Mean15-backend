/* backfill-hcap-rochIndexAfterTodaysScore.js
 * Sets rochIndexAfterTodaysScore = newHCap on every HCap document that has
 * a newHCap value but is missing rochIndexAfterTodaysScore (or has it null).
 *
 * Usage: node scripts/backfill-hcap-rochIndexAfterTodaysScore.js
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
      newHCap: { $exists: true, $ne: null },
      $or: [{ rochIndexAfterTodaysScore: { $exists: false } }, { rochIndexAfterTodaysScore: null }],
    }).lean();

    console.log(`Found ${docs.length} HCap records to update`);

    let updated = 0;
    let skipped = 0;

    for (const doc of docs) {
      try {
        await HCap.findByIdAndUpdate(doc._id, { rochIndexAfterTodaysScore: doc.newHCap });
        updated++;
        console.log(`Updated HCap ${doc._id} (${doc.name || ''}) rochIndexAfterTodaysScore = ${doc.newHCap}`);
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

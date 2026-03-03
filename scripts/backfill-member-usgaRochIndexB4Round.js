const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Member = require('../models/Member');

async function backfill() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mean15b';
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri);

  try {
    // Only update members where usgaIndex exists and at least one of the new fields is missing or null
    const members = await Member.find({
      usgaIndex: { $exists: true, $ne: null },
      $or: [
        { usgaIndexB4Round: { $exists: false } },
        { usgaIndexB4Round: null },
        { rochIndexB4Round: { $exists: false } },
        { rochIndexB4Round: null }
      ]
    }).lean();

    console.log(`Found ${members.length} members to update`);

    let updated = 0;
    let skipped = 0;

    for (const member of members) {
      try {
        await Member.findByIdAndUpdate(member._id, {
          usgaIndexB4Round: member.usgaIndex,
          rochIndexB4Round: member.usgaIndex
        });
        updated++;
        console.log(`Updated member ${member._id} usgaIndexB4Round & rochIndexB4Round = ${member.usgaIndex}`);
      } catch (err) {
        console.warn('Error updating member', member._id, err);
        skipped++;
      }
    }

    console.log(`\nBackfill complete. Updated: ${updated}, Skipped/errored: ${skipped}`);
  } catch (err) {
    console.error('Backfill failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from the database');
  }
}

backfill().catch(err => {
  console.error(err);
  process.exit(1);
});

/* cleanup-match-invalid-members.js
 * Removes any member IDs from lineUps, foursomeIdsTEMP, and partnerIdsTEMP
 * in the matches collection that do not exist in the members collection.
 *
 * Usage: node scripts/cleanup-match-invalid-members.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Match = require('../models/Match');
const Member = require('../models/Member');

async function cleanup() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mean15b';
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri);

  try {
    // Get all valid member IDs as a Set of strings
    const members = await Member.find({}, '_id').lean();
    const validIds = new Set(members.map(m => m._id.toString()));
    console.log(`Found ${validIds.size} valid member IDs`);

    const matches = await Match.find({}).lean();
    console.log(`Found ${matches.length} matches to check`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const match of matches) {
      const update = {};
      let changed = false;

      // Clean lineUps
      if (Array.isArray(match.lineUps) && match.lineUps.length > 0) {
        const cleaned = match.lineUps.filter(id => validIds.has(id?.toString()));
        const removed = match.lineUps.filter(id => !validIds.has(id?.toString()));
        if (removed.length > 0) {
          console.log(`Match ${match._id} (${match.name}): removing from lineUps: [${removed.join(', ')}]`);
          update.lineUps = cleaned;
          changed = true;
        }
      }

      // Clean foursomeIdsTEMP (array of arrays)
      if (Array.isArray(match.foursomeIdsTEMP) && match.foursomeIdsTEMP.length > 0) {
        const cleanedFoursomes = match.foursomeIdsTEMP.map(group =>
          Array.isArray(group) ? group.filter(id => validIds.has(id?.toString())) : group
        );
        const removedAny = match.foursomeIdsTEMP.some((group, i) =>
          Array.isArray(group) && group.some(id => !validIds.has(id?.toString()))
        );
        if (removedAny) {
          console.log(`Match ${match._id} (${match.name}): cleaning foursomeIdsTEMP`);
          update.foursomeIdsTEMP = cleanedFoursomes;
          changed = true;
        }
      }

      // Clean partnerIdsTEMP (array of arrays)
      if (Array.isArray(match.partnerIdsTEMP) && match.partnerIdsTEMP.length > 0) {
        const cleanedPartners = match.partnerIdsTEMP.map(group =>
          Array.isArray(group) ? group.filter(id => validIds.has(id?.toString())) : group
        );
        const removedAny = match.partnerIdsTEMP.some((group) =>
          Array.isArray(group) && group.some(id => !validIds.has(id?.toString()))
        );
        if (removedAny) {
          console.log(`Match ${match._id} (${match.name}): cleaning partnerIdsTEMP`);
          update.partnerIdsTEMP = cleanedPartners;
          changed = true;
        }
      }

      if (changed) {
        await Match.findByIdAndUpdate(match._id, update);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\nCleanup complete. Updated: ${updatedCount}, Unchanged: ${skippedCount}`);
  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from the database');
  }
}

cleanup().catch(err => {
  console.error(err);
  process.exit(1);
});

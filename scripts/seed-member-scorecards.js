/**
 * Seed script: backfill member.scorecardsId for members with an empty array.
 *
 * For each qualifying member it adds:
 *   - one randomly selected scorecard with course = "CCC Blue"
 *   - one randomly selected scorecard with course = "CCC Gold"
 *
 * Usage:
 *   node scripts/seed-member-scorecards.js          (dry-run — no writes)
 *   DRY_RUN=false node scripts/seed-member-scorecards.js   (live run)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Member = require('../models/Member');
const Scorecard = require('../models/Scorecard');

const DRY_RUN = process.env.DRY_RUN !== 'false';

// ── helpers ─────────────────────────────────────────────────────────────────

/** Pick a random element from an array. Returns undefined if array is empty. */
function pickRandom(arr) {
  if (!arr.length) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── main ─────────────────────────────────────────────────────────────────────

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mean15b';
  console.log(`Connecting to ${mongoUri}`);
  await mongoose.connect(mongoUri);

  try {
    // 1. Find all "CCC Blue" scorecards (course field = "CCC Blue")
    const blueCards = await Scorecard.find({
      course: { $regex: /^CCC-Blue$/i },
    }).select('_id course tees').lean();

    // 2. Find all "CCC Gold" scorecards (course field = "CCC Gold")
    const goldCards = await Scorecard.find({
      course: { $regex: /^CCC-Gold$/i },
    }).select('_id course tees').lean();

    console.log(`\nFound ${blueCards.length} CCC-Blue scorecard(s):`);
    blueCards.forEach(sc => console.log(`  ${sc._id}  ${sc.course} / ${sc.tees}`));

    console.log(`\nFound ${goldCards.length} CCC-Gold scorecard(s):`);
    goldCards.forEach(sc => console.log(`  ${sc._id}  ${sc.course} / ${sc.tees}`));

    if (!blueCards.length || !goldCards.length) {
      console.error('\nERROR: Need at least one Blue and one Gold scorecard to proceed. Aborting.');
      return;
    }

    // 3. Find members with an empty (or missing) scorecardsId array
    const emptyMembers = await Member.find({
      $or: [
        { scorecardsId: { $exists: false } },
        { scorecardsId: { $size: 0 } },
      ],
    }).select('_id firstName lastName scorecardsId').lean();

    console.log(`\nMembers with empty scorecardsId: ${emptyMembers.length}`);

    if (!emptyMembers.length) {
      console.log('Nothing to do — all members already have scorecards assigned.');
      return;
    }

    // 4. Preview / apply
    let updated = 0;
    for (const member of emptyMembers) {
      const blue = pickRandom(blueCards);
      const gold = pickRandom(goldCards);
      const ids  = [blue._id.toString(), gold._id.toString()];

      console.log(
        `  ${DRY_RUN ? '[DRY-RUN] would update' : 'Updating'} ` +
        `${member.firstName} ${member.lastName} (${member._id})` +
        `  →  [${blue.course}/${blue.tees}: ${blue._id}, ${gold.course}/${gold.tees}: ${gold._id}]`
      );

      if (!DRY_RUN) {
        await Member.findByIdAndUpdate(member._id, { $set: { scorecardsId: ids } });
        updated++;
      }
    }

    if (DRY_RUN) {
      console.log(`\nDRY-RUN complete. ${emptyMembers.length} members would be updated.`);
      console.log('Re-run with  DRY_RUN=false  to apply changes.');
    } else {
      console.log(`\nDone. Updated ${updated} members.`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

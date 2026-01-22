const HCap = require('../models/HCap');
const Score = require('../models/Score');
const Match = require('../models/Match');
const Member = require('../models/Member');
const Scorecard = require('../models/Scorecard');
const User = require('../models/User');

class OrphanHandler {
  /**
   * Find all orphaned HCaps (referencing missing members, matches, or scorecards)
   */
  async findOrphanedHcaps() {
    const hcapOrphans = [];
    const hcaps = await HCap.find({});
    for (const hcap of hcaps) {
      let matchMissing = false;
      let scoreMissing = false;
      // Debug log
      // console.log('[OrphanHandler] HCap:', hcap._id, 'matchId:', hcap.matchId, 'scoreId:', hcap.scoreId);
      // Check matchId: null/undefined or missing Match
      let matchIdToCheck = null;
      if (hcap.matchId == null) {
        matchMissing = true;
      } else if (typeof hcap.matchId === 'object' && hcap.matchId._id) {
        matchIdToCheck = hcap.matchId._id;
      } else {
        matchIdToCheck = hcap.matchId;
      }
      if (!matchMissing && matchIdToCheck) {
        const match = await Match.findById(String(matchIdToCheck));
        if (!match) matchMissing = true;
      }
      // Check scoreId: null/undefined or missing Score
      let scoreIdToCheck = null;
      if (hcap.scoreId == null) {
        scoreMissing = true;
      } else if (typeof hcap.scoreId === 'object' && hcap.scoreId._id) {
        scoreIdToCheck = hcap.scoreId._id;
      } else {
        scoreIdToCheck = hcap.scoreId;
      }
      if (!scoreMissing && scoreIdToCheck) {
        const score = await Score.findById(String(scoreIdToCheck));
        if (!score) scoreMissing = true;
      }
      // Only orphaned if BOTH are missing or invalid
      if (matchMissing && scoreMissing) {
        hcapOrphans.push({ hcap, reason: 'No valid matchId or scoreId' });
      }
    }
    return hcapOrphans;
  }

  /**
   * Find all orphaned scores and categorize them
   */
  async findOrphanedScores() {
    const orphans = {
      matchOrphans: [],
      memberOrphans: [],
      scorecardOrphans: [],
      userOrphans: [],
      intentionalOrphans: [] // scores intentionally orphaned (orphaned: true, matchId: null)
    };
    const scores = await Score.find({});
    for (const score of scores) {
      if (score.matchId && !(await Match.findById(score.matchId))) {
        orphans.matchOrphans.push(score);
      }
      if (score.memberId && !(await Member.findById(score.memberId))) {
        orphans.memberOrphans.push(score);
      }
      if (score.scorecardId && !(await Scorecard.findById(score.scorecardId))) {
        orphans.scorecardOrphans.push(score);
      }
      // Add intentionally orphaned scores
      if (score.orphaned === true && (score.matchId === null || score.matchId === undefined)) {
        orphans.intentionalOrphans.push(score);
      }
    }
    return orphans;
  }

  /**
   * Generate report of orphaned records
   */
  async generateOrphanReport() {
    let orphans;
    try {
      orphans = await this.findOrphanedScores();
    } catch (err) {
      console.error('[generateOrphanReport] Error in findOrphanedScores:', err);
      orphans = {};
    }
    // Defensive: ensure orphans object and arrays exist
    orphans = orphans || {};
    const matchOrphans = Array.isArray(orphans.matchOrphans) ? orphans.matchOrphans : [];
    const memberOrphans = Array.isArray(orphans.memberOrphans) ? orphans.memberOrphans : [];
    const scorecardOrphans = Array.isArray(orphans.scorecardOrphans) ? orphans.scorecardOrphans : [];
    const userOrphans = Array.isArray(orphans.userOrphans) ? orphans.userOrphans : [];
    const intentionalOrphans = Array.isArray(orphans.intentionalOrphans) ? orphans.intentionalOrphans : [];
    return {
      summary: {
        totalOrphans: matchOrphans.length + memberOrphans.length + scorecardOrphans.length + userOrphans.length + intentionalOrphans.length,
        matchOrphans: matchOrphans.length,
        memberOrphans: memberOrphans.length,
        scorecardOrphans: scorecardOrphans.length,
        userOrphans: userOrphans.length,
        intentionalOrphans: intentionalOrphans.length
      },
      details: {
        matchOrphans,
        memberOrphans,
        scorecardOrphans,
        userOrphans,
        intentionalOrphans
      },
      recommendations: this.getRecommendations({ matchOrphans, memberOrphans, scorecardOrphans, userOrphans, intentionalOrphans })
    };
  }

  /**
   * Get recommendations based on orphan analysis
   */
  getRecommendations(orphans) {
    const recommendations = [];

    if (orphans.matchOrphans.length > 0) {
      recommendations.push({
        type: 'match',
        message: `${orphans.matchOrphans.length} scores reference deleted matches. Consider nullifying matchId.`,
        severity: 'medium'
      });
    }

    if (orphans.memberOrphans.length > 0) {
      recommendations.push({
        type: 'member',
        message: `${orphans.memberOrphans.length} scores reference deleted members. Consider deletion or data recovery.`,
        severity: 'high'
      });
    }

    if (orphans.scorecardOrphans.length > 0) {
      recommendations.push({
        type: 'scorecard',
        message: `${orphans.scorecardOrphans.length} scores reference deleted scorecards. Course data will be missing.`,
        severity: 'low'
      });
    }

    if (orphans.userOrphans.length > 0) {
      recommendations.push({
        type: 'user',
        message: `${orphans.userOrphans.length} scores reference deleted users. Reassign to admin user.`,
        severity: 'medium'
      });
    }

    return recommendations;
  }
}

module.exports = new OrphanHandler();
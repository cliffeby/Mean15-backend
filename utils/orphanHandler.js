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
        console.log(`Checking HCap:`, hcap);
        // Check for orphaned member
        if (hcap.memberId) {
          const member = await Member.findById(hcap.memberId);
          if (!member) {
            hcapOrphans.push({ hcap, reason: 'Missing member' });
            continue;
          }
        }
        // Check for orphaned match
        if (hcap.matchId) {
          const match = await Match.findById(hcap.matchId);
          
          if (!match) {
            hcapOrphans.push({ hcap, reason: 'Missing match' });
            continue;
          }
        }
        // Check for orphaned scorecard
        if (hcap.scorecardId) {
          const scorecard = await Scorecard.findById(hcap.scorecardId);
          if (!scorecard) {
            hcapOrphans.push({ hcap, reason: 'Missing scorecard' });
            continue;
          }
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
      userOrphans: []
    };

    // Find all scores
    class OrphanHandler {
      // Find orphaned HCaps (referencing missing members, matches, or scorecards)
      async findOrphanedHcaps() {
        const hcapOrphans = [];
        const hcaps = await HCap.find({});
        for (const hcap of hcaps) {
          if (hcap.memberId && !(await Member.findById(hcap.memberId))) {
            hcapOrphans.push({ hcap, reason: 'Missing member' });
            continue;
          }
          if (hcap.matchId && !(await Match.findById(hcap.matchId))) {
            hcapOrphans.push({ hcap, reason: 'Missing match' });
            continue;
          }
          if (hcap.scorecardId && !(await Scorecard.findById(hcap.scorecardId))) {
            hcapOrphans.push({ hcap, reason: 'Missing scorecard' });
            continue;
          }
        }
        return hcapOrphans;
      }

      // Find orphaned Scores (referencing missing members, matches, or scorecards)
      async findOrphanedScores() {
        const orphans = {
          matchOrphans: [],
          memberOrphans: [],
          scorecardOrphans: [],
          userOrphans: []
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
        }
        return orphans;
      }

      // Simple report of orphaned records
      async generateOrphanReport() {
        return {
          hcapOrphans: await this.findOrphanedHcaps(),
          scoreOrphans: await this.findOrphanedScores()
        };
      }
    }

    module.exports = new OrphanHandler();
    const allOrphans = [
      ...orphans.matchOrphans,
      ...orphans.memberOrphans,
      ...orphans.scorecardOrphans,
      ...orphans.userOrphans
    ];

    // Remove duplicates
    const uniqueOrphans = allOrphans.filter((score, index, self) =>
      index === self.findIndex(s => s._id.toString() === score._id.toString())
    );

    for (const score of uniqueOrphans) {
      await Score.findByIdAndDelete(score._id);
      results.deleted++;
    }
  }

  /**
   * Set orphaned references to null
   */
  async nullifyOrphanedReferences(orphans, results) {
    // Handle match orphans
    for (const score of orphans.matchOrphans) {
      await Score.findByIdAndUpdate(score._id, { matchId: null });
      results.nullified++;
    }

    // Handle member orphans
    for (const score of orphans.memberOrphans) {
      await Score.findByIdAndUpdate(score._id, { memberId: null });
      results.nullified++;
    }

    // Handle scorecard orphans
    for (const score of orphans.scorecardOrphans) {
      await Score.findByIdAndUpdate(score._id, { scorecardId: null });
      results.nullified++;
    }

    // Handle user orphans - don't nullify, but could reassign to admin
    for (const score of orphans.userOrphans) {
      // Find an admin user to reassign to
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        await Score.findByIdAndUpdate(score._id, { user: adminUser._id });
        results.cleaned++;
      }
    }
  }

  /**
   * Preserve orphaned scores but add metadata
   */
  async preserveOrphanedScores(orphans, results) {
    // Could add a field to mark orphaned status
    // This would require schema changes
    
    for (const score of orphans.matchOrphans) {
      await Score.findByIdAndUpdate(score._id, { 
        matchId: null,
        // Could add: orphanedMatch: true, orphanedAt: new Date()
      });
      results.preserved = (results.preserved || 0) + 1;
    }
    // Similar for other orphan types...
  }

  /**
   * Generate report of orphaned records
   */
  async generateOrphanReport() {
    const orphans = await this.findOrphanedScores();
    
    return {
      summary: {
        totalOrphans: orphans.matchOrphans.length + 
                     orphans.memberOrphans.length + 
                     orphans.scorecardOrphans.length + 
                     orphans.userOrphans.length,
        matchOrphans: orphans.matchOrphans.length,
        memberOrphans: orphans.memberOrphans.length,
        scorecardOrphans: orphans.scorecardOrphans.length,
        userOrphans: orphans.userOrphans.length
      },
      details: orphans,
      recommendations: this.getRecommendations(orphans)
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
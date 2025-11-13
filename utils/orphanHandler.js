const Score = require('../models/Score');
const Match = require('../models/Match');
const Member = require('../models/Member');
const Scorecard = require('../models/Scorecard');
const User = require('../models/User');

class OrphanHandler {
  
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
    const scores = await Score.find({});
    
    for (const score of scores) {
      // Check for orphaned match references
      if (score.matchId) {
        const match = await Match.findById(score.matchId);
        if (!match) {
          orphans.matchOrphans.push(score);
        }
      }

      // Check for orphaned member references
      if (score.memberId) {
        const member = await Member.findById(score.memberId);
        if (!member) {
          orphans.memberOrphans.push(score);
        }
      }

      // Check for orphaned scorecard references
      if (score.scorecardId) {
        const scorecard = await Scorecard.findById(score.scorecardId);
        if (!scorecard) {
          orphans.scorecardOrphans.push(score);
        }
      }

      // Check for orphaned user references
      if (score.user) {
        const user = await User.findById(score.user);
        if (!user) {
          orphans.userOrphans.push(score);
        }
      }
    }

    return orphans;
  }

  /**
   * Clean up orphaned scores with different strategies
   */
  async cleanupOrphans(strategy = 'nullify') {
    const orphans = await this.findOrphanedScores();
    const results = {
      cleaned: 0,
      deleted: 0,
      nullified: 0,
      errors: []
    };

    try {
      switch (strategy) {
        case 'delete':
          // Delete scores that have orphaned references
          await this.deleteOrphanedScores(orphans, results);
          break;
        
        case 'nullify':
          // Set orphaned references to null
          await this.nullifyOrphanedReferences(orphans, results);
          break;
        
        case 'preserve':
          // Keep scores but mark them clearly
          await this.preserveOrphanedScores(orphans, results);
          break;
        
        default:
          throw new Error('Invalid cleanup strategy');
      }
    } catch (error) {
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Delete scores with orphaned references
   */
  async deleteOrphanedScores(orphans, results) {
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
// controllers/memberController.js
const Member = require('../models/Member');
const Score = require('../models/Score');
// const { extractAuthor } = require('../middleware/authorExtractor');

exports.getMembers = async (req, res, next) => {
  try {
    const members = await Member.find();
    res.json({ success: true, count: members.length, members });
  } catch (err) {
    next(err);
  }
};

exports.getMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, member });
  } catch (err) {
    next(err);
  }
};

exports.createMember = async (req, res, next) => {
  try {
    const memberData = { ...req.body, author: req.author };
    const member = await Member.create(memberData);
    res.status(201).json({ success: true, member });
  } catch (err) {
    next(err);
  }
};

exports.updateMember = async (req, res, next) => {
  try {
    const memberData = { ...req.body, author: req.author };
    const member = await Member.findByIdAndUpdate(req.params.id, memberData, { new: true });
    if (!member) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, member });
  } catch (err) {
    next(err);
  }
};

exports.deleteMember = async (req, res, next) => {
  try {
    const memberId = req.params.id;
    
    // Check for associated scores
    const associatedScores = await Score.find({ memberId: memberId });
    
    if (associatedScores.length > 0) {
      // Check if force delete was requested - handle undefined req.body
      const { force, action } = req.body || {};
      
      if (!force) {
        return res.status(409).json({ 
          success: false, 
          message: 'Cannot delete member with associated scores',
          conflictType: 'scores',
          conflictCount: associatedScores.length,
          scores: associatedScores.map(score => ({
            id: score._id,
            name: score.name,
            datePlayed: score.datePlayed,
            score: score.score
          })),
          options: {
            nullify: 'Remove member reference from scores (scores become orphaned)',
            delete: 'Delete member and all associated scores',
            cancel: 'Cancel deletion'
          }
        });
      }
      
      // Handle forced deletion with specified action
      if (action === 'nullify') {
        // Set memberId to null for all associated scores
        await Score.updateMany({ memberId: memberId }, { memberId: null });
        console.log(`Nullified memberId for ${associatedScores.length} scores`);
      } else if (action === 'delete') {
        // Delete all associated scores
        await Score.deleteMany({ memberId: memberId });
        console.log(`Deleted ${associatedScores.length} associated scores`);
      } else if (action) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use "nullify" or "delete"'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Action required when force=true. Use "nullify" or "delete"'
        });
      }
    }

    // Now delete the member
    const member = await Member.findByIdAndDelete(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Not found' });
    
    res.json({ 
      success: true, 
      message: 'Member deleted successfully',
      scoresAffected: associatedScores.length,
      action: associatedScores.length > 0 ? (req.body.action || 'none') : 'none'
    });
  } catch (err) {
    next(err);
  }
};

exports.removeDuplicateEmails = async (req, res, next) => {
  try {
    // Find all members with duplicate email addresses
    const duplicates = await Member.aggregate([
      {
        $match: {
          Email: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: { $toLower: "$Email" }, // Group by email (case insensitive)
          members: { $push: { _id: "$_id", createdAt: "$createdAt", firstName: "$firstName", lastName: "$lastName", Email: "$Email" } },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 } // Only groups with more than 1 member
        }
      }
    ]);

    let deletedCount = 0;
    const deletedMembers = [];

    for (const group of duplicates) {
      // Sort by createdAt to keep the oldest member (first registered)
      const sortedMembers = group.members.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Keep the first one, delete the rest
      const membersToDelete = sortedMembers.slice(1);
      
      for (const memberToDelete of membersToDelete) {
        await Member.findByIdAndDelete(memberToDelete._id);
        deletedMembers.push({
          id: memberToDelete._id,
          name: `${memberToDelete.firstName} ${memberToDelete.lastName}`,
          email: memberToDelete.Email
        });
        deletedCount++;
      }
    }

    res.json({ 
      success: true, 
      message: `Removed ${deletedCount} duplicate members`,
      duplicateGroupsFound: duplicates.length,
      deletedMembers: deletedMembers,
      deletedCount: deletedCount
    });
  } catch (err) {
    next(err);
  }
};
  // Utility to assign random USGAIndex
  function assignRandomUSGAIndex(member) {
    if (!member.usgaIndex || member.usgaIndex === 0) {
      // Range: -5.0 to 30.0
      member.usgaIndex = Math.round((Math.random() * 35 - 5) * 10) / 10;
    }
    return member;
  }

  // Batch endpoint: assign random index to all members with missing/zero index
  exports.assignRandomIndexBatch = async (req, res) => {
    try {
      const members = await require('../models/Member').find({ $or: [ { usgaIndex: { $exists: false } }, { usgaIndex: 0 }, { usgaIndex: null } ] });
      let updated = [];
      for (const member of members) {
        assignRandomUSGAIndex(member);
        await member.save();
        updated.push({ _id: member._id, usgaIndex: member.usgaIndex });
      }
      res.json({ updatedCount: updated.length, updated });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

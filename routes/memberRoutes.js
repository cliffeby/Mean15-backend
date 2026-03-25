const express = require('express');
const router = express.Router();

const { getMembers, getMember, createMember, updateMember, deleteMember, removeDuplicateEmails, assignRandomIndexBatch, resetBounceStatus } = require('../controllers/memberController');
const { requireMinRole, ROLE_LEVELS } = require('../middleware/roleHierarchy');
const { extractAuthor } = require('../middleware/authorExtractor');
const Member = require('../models/Member');

// Auth is now handled globally in app.js via jwtCheck middleware

/**
 * Allows the request if the user is admin+ OR if the user's email matches
 * the member email being created/updated (resource ownership).
 */
const allowSelfOrAdmin = async (req, res, next) => {
  try {
    const role = req.user?.role;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    // Admins and above pass through immediately
    if ((ROLE_LEVELS[role] || 0) >= ROLE_LEVELS['admin']) return next();

    const userEmail = req.user.email?.toLowerCase();

    if (req.method === 'POST') {
      const bodyEmail = req.body?.Email?.toLowerCase();
      if (bodyEmail && bodyEmail === userEmail) return next();
      return res.status(403).json({ error: 'You can only create a member entry for your own email address' });
    }

    if (req.method === 'PUT') {
      const member = await Member.findById(req.params.id).lean();
      if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
      if (member.Email?.toLowerCase() === userEmail) return next();
      return res.status(403).json({ error: 'You can only update your own member record' });
    }

    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    next(err);
  }
};

// Read routes: any authenticated user
router.get('/', getMembers);           // Get all members
// Batch assign random USGAIndex to all members with missing/zero index
router.post('/assign-random-index-batch', requireMinRole('admin'), extractAuthor, assignRandomIndexBatch);
router.get('/:id', getMember);         // Get single member

// Write routes: admin, OR self (email match) for create/update
router.post('/', allowSelfOrAdmin, extractAuthor, createMember);
router.put('/:id', allowSelfOrAdmin, extractAuthor, updateMember);
router.patch('/:id/reset-bounce', requireMinRole('admin'), extractAuthor, resetBounceStatus); // Reset email bounce status
router.delete('/:id', requireMinRole('admin'), extractAuthor, deleteMember);   // Delete member (admin only)
router.delete('/duplicates/remove', requireMinRole('admin'), removeDuplicateEmails);  // Remove duplicate emails


module.exports = router;

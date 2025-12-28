const express = require('express');
const router = express.Router();

const { getMembers, getMember, createMember, updateMember, deleteMember, removeDuplicateEmails, assignRandomIndexBatch } = require('../controllers/memberController');
const { requireMinRole } = require('../middleware/roleHierarchy');
const { extractAuthor } = require('../middleware/authorExtractor');

// Auth is now handled globally in app.js via jwtCheck middleware

// Read routes: any authenticated user
router.get('/', getMembers);           // Get all members
// Batch assign random USGAIndex to all members with missing/zero index
router.post('/assign-random-index-batch', requireMinRole('admin'), extractAuthor, assignRandomIndexBatch);
router.get('/:id', getMember);         // Get single member

// Write routes: admin only
// Debug: log req.auth for create attempts
router.post('/', (req, res, next) => {
	console.log('DEBUG req.auth on create member:', req.auth);
	next();
}, requireMinRole('admin'), extractAuthor, createMember);        // Create new member (editor or admin)

router.put('/:id', requireMinRole('admin'), extractAuthor, updateMember);      // Update member (editor or admin)
router.delete('/:id', requireMinRole('admin'), deleteMember);   // Delete member (admin only)
router.delete('/duplicates/remove', requireMinRole('admin'), removeDuplicateEmails);  // Remove duplicate emails


module.exports = router;

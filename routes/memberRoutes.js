const express = require('express');
const router = express.Router();
const { getMembers, getMember, createMember, updateMember, deleteMember, removeDuplicateEmails, assignRandomIndexBatch } = require('../controllers/memberController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// All routes protected with auth middleware
router.use(auth);

// Read routes: any authenticated user
router.get('/', getMembers);           // Get all members
// Batch assign random USGAIndex to all members with missing/zero index
router.post('/assign-random-index-batch', admin, assignRandomIndexBatch);
router.get('/:id', getMember);         // Get single member

// Write routes: admin only
router.post('/', admin, createMember);        // Create new member

router.put('/:id', admin, updateMember);      // Update membe
router.delete('/:id', admin, deleteMember);   // Delete member
router.delete('/duplicates/remove', admin, removeDuplicateEmails);  // Remove duplicate emails


module.exports = router;

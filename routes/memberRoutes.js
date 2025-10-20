const express = require('express');
const router = express.Router();
const { getMembers, getMember, createMember, updateMember, deleteMember } = require('../controllers/memberController');
const auth = require('../middleware/auth');

// All routes protected with auth middleware
router.use(auth);

router.get('/', getMembers);           // Get all members
router.get('/:id', getMember);         // Get single member
router.post('/', createMember);        // Create new member
router.put('/:id', updateMember);      // Update member
router.delete('/:id', deleteMember);   // Delete member

module.exports = router;

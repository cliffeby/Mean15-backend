// routes/offerRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createOffer,
  getOffers,
  getOfferById,
  updateOffer,
  deleteOffer
} = require('../controllers/offerController');

// All routes protected with auth middleware
router.use(auth);

// CRUD routes
router.post('/', createOffer);        // Create new offer
router.get('/', getOffers);           // Get all offers
router.get('/:id', getOfferById);     // Get single offer by ID
router.put('/:id', updateOffer);      // Update offer
router.delete('/:id', deleteOffer);   // Delete offer

module.exports = router;

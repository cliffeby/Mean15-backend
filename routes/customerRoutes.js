// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const { createCustomer, getCustomers, getCustomer } = require('../controllers/customerController');
const auth = require('../middleware/auth');

router.post('/', auth, createCustomer);
router.get('/', auth, getCustomers);
router.get('/:id', auth, getCustomer);

module.exports = router;

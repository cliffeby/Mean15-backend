// controllers/customerController.js
const Customer = require('../models/Customer');

exports.createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, customer });
  } catch (err) {
    next(err);
  }
};

exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find();
    res.json({ success: true, count: customers.length, customers });
  } catch (err) {
    next(err);
  }
};

exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, customer });
  } catch (err) {
    next(err);
  }
};

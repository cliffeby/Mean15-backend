"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomer = createCustomer;
exports.getAllCustomers = getAllCustomers;
exports.getCustomer = getCustomer;
exports.updateCustomer = updateCustomer;
exports.deleteCustomer = deleteCustomer;
const Customer_js_1 = require("../models/Customer.js");
// Create a new customer (admin only)
async function createCustomer(req, res, next) {
    try {
        const { name, email, phone } = req.body;
        if (!name || !email || !phone) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }
        const customer = await Customer_js_1.Customer.create({ name, email, phone });
        res.status(201).json({ success: true, customer });
    }
    catch (err) {
        next(err);
    }
}
// Get all customers (admin only)
async function getAllCustomers(req, res, next) {
    try {
        const customers = await Customer_js_1.Customer.find();
        res.json({ success: true, customers });
    }
    catch (err) {
        next(err);
    }
}
// Get a single customer by ID (admin only)
async function getCustomer(req, res, next) {
    try {
        const customer = await Customer_js_1.Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.json({ success: true, customer });
    }
    catch (err) {
        next(err);
    }
}
// Update a customer by ID (admin only)
async function updateCustomer(req, res, next) {
    try {
        const customer = await Customer_js_1.Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.json({ success: true, customer });
    }
    catch (err) {
        next(err);
    }
}
// Delete a customer by ID (admin only)
async function deleteCustomer(req, res, next) {
    try {
        const customer = await Customer_js_1.Customer.findByIdAndDelete(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.json({ success: true, message: 'Customer deleted' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=customerController.js.map
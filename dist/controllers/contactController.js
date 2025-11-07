"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitContact = submitContact;
exports.getAllContacts = getAllContacts;
exports.getContact = getContact;
exports.deleteContact = deleteContact;
const Contact_js_1 = require("../models/Contact.js");
// Submit a contact form
async function submitContact(req, res, next) {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }
        const contact = await Contact_js_1.default.create({ name, email, message });
        res.status(201).json({ success: true, contact });
    }
    catch (err) {
        next(err);
    }
}
// Get all contact submissions (admin only)
async function getAllContacts(req, res, next) {
    try {
        const contacts = await Contact_js_1.default.find();
        res.json({ success: true, contacts });
    }
    catch (err) {
        next(err);
    }
}
// Get a single contact submission by ID (admin only)
async function getContact(req, res, next) {
    try {
        const contact = await Contact_js_1.default.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }
        res.json({ success: true, contact });
    }
    catch (err) {
        next(err);
    }
}
// Delete a contact submission by ID (admin only)
async function deleteContact(req, res, next) {
    try {
        const contact = await Contact_js_1.default.findByIdAndDelete(req.params.id);
        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }
        res.json({ success: true, message: 'Contact deleted' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=contactController.js.map
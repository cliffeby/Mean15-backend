"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOffer = createOffer;
exports.getAllOffers = getAllOffers;
exports.getOffer = getOffer;
exports.updateOffer = updateOffer;
exports.deleteOffer = deleteOffer;
const Offer_js_1 = require("../models/Offer.js");
// Create a new offer (admin only)
async function createOffer(req, res, next) {
    try {
        const { title, description, amount, validUntil } = req.body;
        if (!title || !description || !amount || !validUntil) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }
        const offer = await Offer_js_1.Offer.create({ title, description, amount, validUntil });
        res.status(201).json({ success: true, offer });
    }
    catch (err) {
        next(err);
    }
}
// Get all offers (admin only)
async function getAllOffers(req, res, next) {
    try {
        const offers = await Offer_js_1.Offer.find();
        res.json({ success: true, offers });
    }
    catch (err) {
        next(err);
    }
}
// Get a single offer by ID (admin only)
async function getOffer(req, res, next) {
    try {
        const offer = await Offer_js_1.Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
        res.json({ success: true, offer });
    }
    catch (err) {
        next(err);
    }
}
// Update an offer by ID (admin only)
async function updateOffer(req, res, next) {
    try {
        const offer = await Offer_js_1.Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
        res.json({ success: true, offer });
    }
    catch (err) {
        next(err);
    }
}
// Delete an offer by ID (admin only)
async function deleteOffer(req, res, next) {
    try {
        const offer = await Offer_js_1.Offer.findByIdAndDelete(req.params.id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
        res.json({ success: true, message: 'Offer deleted' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=offerController.js.map
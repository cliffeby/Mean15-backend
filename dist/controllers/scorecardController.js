"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScorecard = createScorecard;
exports.getAllScorecards = getAllScorecards;
exports.getScorecard = getScorecard;
exports.updateScorecard = updateScorecard;
exports.deleteScorecard = deleteScorecard;
const Scorecard_js_1 = require("../models/Scorecard.js");
// Create a new scorecard (admin only)
async function createScorecard(req, res, next) {
    try {
        const { name, value, userId } = req.body;
        if (!name || value === undefined || !userId) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }
        const scorecard = await Scorecard_js_1.Scorecard.create({ name, value, userId });
        res.status(201).json({ success: true, scorecard });
    }
    catch (err) {
        next(err);
    }
}
// Get all scorecards (admin only)
async function getAllScorecards(req, res, next) {
    try {
        const scorecards = await Scorecard_js_1.Scorecard.find();
        res.json({ success: true, scorecards });
    }
    catch (err) {
        next(err);
    }
}
// Get a single scorecard by ID (admin only)
async function getScorecard(req, res, next) {
    try {
        const scorecard = await Scorecard_js_1.Scorecard.findById(req.params.id);
        if (!scorecard) {
            return res.status(404).json({ success: false, message: 'Scorecard not found' });
        }
        res.json({ success: true, scorecard });
    }
    catch (err) {
        next(err);
    }
}
// Update a scorecard by ID (admin only)
async function updateScorecard(req, res, next) {
    try {
        const scorecard = await Scorecard_js_1.Scorecard.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!scorecard) {
            return res.status(404).json({ success: false, message: 'Scorecard not found' });
        }
        res.json({ success: true, scorecard });
    }
    catch (err) {
        next(err);
    }
}
// Delete a scorecard by ID (admin only)
async function deleteScorecard(req, res, next) {
    try {
        const scorecard = await Scorecard_js_1.Scorecard.findByIdAndDelete(req.params.id);
        if (!scorecard) {
            return res.status(404).json({ success: false, message: 'Scorecard not found' });
        }
        res.json({ success: true, message: 'Scorecard deleted' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=scorecardController.js.map
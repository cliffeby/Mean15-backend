"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMember = exports.updateMember = exports.createMember = exports.getMember = exports.getMembers = void 0;
const Member_js_1 = require("../models/Member.js");
const getMembers = async (req, res, next) => {
    try {
        const members = await Member_js_1.Member.find();
        res.json({ success: true, count: members.length, members });
    }
    catch (err) {
        next(err);
    }
};
exports.getMembers = getMembers;
const getMember = async (req, res, next) => {
    try {
        const member = await Member_js_1.Member.findById(req.params.id);
        if (!member)
            return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, member });
    }
    catch (err) {
        next(err);
    }
};
exports.getMember = getMember;
const createMember = async (req, res, next) => {
    try {
        const member = await Member_js_1.Member.create(req.body);
        res.status(201).json({ success: true, member });
    }
    catch (err) {
        next(err);
    }
};
exports.createMember = createMember;
const updateMember = async (req, res, next) => {
    try {
        const member = await Member_js_1.Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!member)
            return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, member });
    }
    catch (err) {
        next(err);
    }
};
exports.updateMember = updateMember;
const deleteMember = async (req, res, next) => {
    try {
        const member = await Member_js_1.Member.findByIdAndDelete(req.params.id);
        if (!member)
            return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Member deleted' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteMember = deleteMember;
//# sourceMappingURL=memberController.js.map
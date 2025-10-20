// controllers/memberController.js
const Member = require('../models/Member');

exports.getMembers = async (req, res, next) => {
  try {
    const members = await Member.find();
    res.json({ success: true, count: members.length, members });
  } catch (err) {
    next(err);
  }
};

exports.getMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, member });
  } catch (err) {
    next(err);
  }
};

exports.createMember = async (req, res, next) => {
  try {
    const member = await Member.create(req.body);
    res.status(201).json({ success: true, member });
  } catch (err) {
    next(err);
  }
};

exports.updateMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!member) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, member });
  } catch (err) {
    next(err);
  }
};

exports.deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Member deleted' });
  } catch (err) {
    next(err);
  }
};

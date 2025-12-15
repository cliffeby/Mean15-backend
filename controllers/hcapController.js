const HCap = require('../models/HCap');
const Member = require('../models/Member');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.getHcaps = async (req, res, next) => {
  try {
    const hcaps = await HCap.find()
      .populate('matchId', 'name datePlayed status')
      .populate('memberId', 'firstName lastName Email')
      .populate('scorecardId', 'name')
      .sort({ datePlayed: -1 });
    res.json({ success: true, count: hcaps.length, hcaps });
  } catch (err) {
    next(err);
  }
};

exports.getHcap = async (req, res, next) => {
  try {
    const hcap = await HCap.findById(req.params.id);
    if (!hcap) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, hcap });
  } catch (err) {
    next(err);
  }
};

exports.createHcap = async (req, res, next) => {
  try {
    console.log('Creating HCap with data:', JSON.stringify(req.body, null, 2));

    const hcapData = { ...req.body, author: req.author };

    const convertToObjectId = (value, fieldName) => {
      if (!value) return value;
      if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
      }
      if (mongoose.Types.ObjectId.isValid(value)) {
        return value;
      }
      console.warn(`Invalid ObjectId for ${fieldName}: ${value}`);
      return value;
    };

    hcapData.scorecardId = convertToObjectId(hcapData.scorecardId, 'scorecardId');
    hcapData.matchId = convertToObjectId(hcapData.matchId, 'matchId');
    hcapData.memberId = convertToObjectId(hcapData.memberId, 'memberId');
    hcapData.userId = convertToObjectId(hcapData.userId, 'userId');

    // If a userId is provided, try to look up the user's name/email to populate a username field
    if (hcapData.userId) {
      try {
        const user = await User.findById(hcapData.userId).select('name email');
        if (user) {
          // Prefer the user's `name` field from the User model. Fall back to email if name missing.
          hcapData.user = user.name || user.email || hcapData.user || '';
          // Keep username in sync for older clients that expect it
          hcapData.username = hcapData.user;
        }
      } catch (uErr) {
        console.warn('Failed to lookup user for HCap.username population:', uErr);
      }
    }

    const hcap = await HCap.create(hcapData);

    // Update member's lastDatePlayed if we have a memberId and datePlayed
    if (hcap.memberId && hcap.datePlayed) {
      try {
        await Member.findByIdAndUpdate(
          hcap.memberId,
          { lastDatePlayed: hcap.datePlayed },
          { new: true }
        );
      } catch (memberErr) {
        console.warn('Failed to update member lastDatePlayed:', memberErr);
      }
    }

    console.log('Created HCap:', JSON.stringify(hcap, null, 2));
    res.status(201).json({ success: true, hcap });
  } catch (err) {
    console.error('Error creating HCap:', err);
    next(err);
  }
};

exports.updateHcap = async (req, res, next) => {
  try {
    console.log('Updating HCap with ID:', req.params.id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));

    const updateData ={ ...req.body, author: req.author };

    const convertToObjectId = (value, fieldName) => {
      if (!value) return value;
      if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
      }
      if (mongoose.Types.ObjectId.isValid(value)) {
        return value;
      }
      console.warn(`Invalid ObjectId for ${fieldName}: ${value}`);
      return value;
    };

    updateData.scorecardId = convertToObjectId(updateData.scorecardId, 'scorecardId');
    updateData.matchId = convertToObjectId(updateData.matchId, 'matchId');
    updateData.memberId = convertToObjectId(updateData.memberId, 'memberId');
    updateData.userId = convertToObjectId(updateData.userId, 'userId');

    // Try to populate username from userId when updating
    if (updateData.userId) {
      try {
        const user = await User.findById(updateData.userId).select('name email');
        if (user) {
          // Use the User.name field as the canonical user string
          updateData.user = user.name || user.email || updateData.user || '';
          updateData.username = updateData.user;
        }
      } catch (uErr) {
        console.warn('Failed to lookup user for HCap.username population (update):', uErr);
      }
    }

    const hcap = await HCap.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!hcap) return res.status(404).json({ success: false, message: 'Not found' });

    if (hcap.memberId && hcap.datePlayed) {
      try {
        await Member.findByIdAndUpdate(
          hcap.memberId,
          { lastDatePlayed: hcap.datePlayed },
          { new: true }
        );
      } catch (memberErr) {
        console.warn('Failed to update member lastDatePlayed:', memberErr);
      }
    }

    console.log('Updated HCap:', JSON.stringify(hcap, null, 2));
    res.json({ success: true, hcap });
  } catch (err) {
    console.error('Error updating HCap:', err);
    next(err);
  }
};

exports.deleteHcap = async (req, res, next) => {
  try {
    const hcap = await HCap.findByIdAndDelete(req.params.id);
    if (!hcap) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'HCap deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getHcapsByMember = async (req, res, next) => {
  try {
    const hcaps = await HCap.find({ memberId: req.params.memberId });
    res.json({ success: true, count: hcaps.length, hcaps });
  } catch (err) {
    next(err);
  }
};

exports.getHcapsByMatch = async (req, res, next) => {
  try {
    const hcaps = await HCap.find({ matchId: req.params.matchId })
      .populate('matchId', 'name datePlayed status')
      .populate('memberId', 'name email')
      .populate('scorecardId', 'name')
      .sort({ datePlayed: -1 });
    res.json({ success: true, count: hcaps.length, hcaps });
  } catch (err) {
    next(err);
  }
};

exports.getHcapsByScorecard = async (req, res, next) => {
  try {
    const hcaps = await HCap.find({ scorecardId: req.params.scorecardId });
    res.json({ success: true, count: hcaps.length, hcaps });
  } catch (err) {
    next(err);
  }
};

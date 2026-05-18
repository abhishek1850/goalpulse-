const CheckIn = require('../models/CheckIn');
const Goal = require('../models/Goal');
const createAuditLog = require('../utils/auditLogger');

// @desc    Create a check-in
// @route   POST /api/checkins
exports.createCheckIn = async (req, res) => {
  try {
    const { goalId, quarter, year, achievements, challenges, selfRating, progressUpdate } = req.body;

    // Verify the goal exists and belongs to user
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (goal.status !== 'approved' && goal.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Check-ins can only be added to approved goals' });
    }

    const checkin = await CheckIn.create({
      goal: goalId,
      user: req.user._id,
      quarter,
      year,
      achievements,
      challenges,
      selfRating,
      progressUpdate,
    });

    // Update goal progress
    if (progressUpdate) {
      goal.progressPercent = progressUpdate;
      if (progressUpdate === 100) goal.status = 'completed';
      await goal.save();
    }

    await createAuditLog({
      user: req.user._id,
      action: 'checkin_created',
      entity: 'checkin',
      entityId: checkin._id,
      details: `Check-in created for goal: ${goal.title}`,
    });

    res.status(201).json({ success: true, data: checkin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my check-ins
// @route   GET /api/checkins
exports.getMyCheckIns = async (req, res) => {
  try {
    const { quarter, year } = req.query;
    const filter = { user: req.user._id };
    if (quarter) filter.quarter = quarter;
    if (year) filter.year = parseInt(year);

    const checkins = await CheckIn.find(filter)
      .populate('goal', 'title category status progressPercent')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: checkins, count: checkins.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get team check-ins (Manager)
// @route   GET /api/checkins/team
exports.getTeamCheckIns = async (req, res) => {
  try {
    const User = require('../models/User');
    const teamMembers = await User.find({ manager: req.user._id }).select('_id');
    const memberIds = teamMembers.map((m) => m._id);

    const { quarter, year } = req.query;
    const filter = { user: { $in: memberIds } };
    if (quarter) filter.quarter = quarter;
    if (year) filter.year = parseInt(year);

    const checkins = await CheckIn.find(filter)
      .populate('goal', 'title category status progressPercent')
      .populate('user', 'firstName lastName email department')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: checkins, count: checkins.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review check-in (Manager)
// @route   PUT /api/checkins/:id/review
exports.reviewCheckIn = async (req, res) => {
  try {
    const checkin = await CheckIn.findById(req.params.id).populate('goal');

    if (!checkin) {
      return res.status(404).json({ success: false, message: 'Check-in not found' });
    }

    checkin.managerRating = req.body.managerRating;
    checkin.managerComments = req.body.managerComments || '';
    checkin.status = 'reviewed';
    await checkin.save();

    await createAuditLog({
      user: req.user._id,
      action: 'checkin_reviewed',
      entity: 'checkin',
      entityId: checkin._id,
      details: `Check-in reviewed with rating ${req.body.managerRating}/5`,
    });

    res.json({ success: true, data: checkin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

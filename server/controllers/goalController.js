const Goal = require('../models/Goal');
const createAuditLog = require('../utils/auditLogger');

/* ════════════════════════════════════════════════════════
   VALIDATION CONSTANTS
   ════════════════════════════════════════════════════════ */
const MAX_GOALS    = 8;
const MIN_WEIGHT   = 10;
const TOTAL_WEIGHT = 100;

/* Helper: fetch editable (draft + rework) goals for a user */
const getEditableGoals = (userId) =>
  Goal.find({ user: userId, approvalStatus: { $in: ['draft', 'rework'] } });

/* ════════════════════════════════════════════════════════
   CREATE
   ════════════════════════════════════════════════════════ */
exports.createGoal = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count existing non-deleted goals
    const totalCount = await Goal.countDocuments({ user: userId });
    if (totalCount >= MAX_GOALS) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_GOALS} goals are allowed.`,
      });
    }

    const {
      title, description, thrustArea, uomType,
      targetValue, deadline, weightage, isSharedGoal,
      quarter, year, category, priority,
    } = req.body;

    // Weightage floor check
    if (weightage < MIN_WEIGHT) {
      return res.status(400).json({
        success: false,
        message: `Minimum weightage per goal is ${MIN_WEIGHT}%.`,
      });
    }

    const goal = await Goal.create({
      user: userId,
      title,
      description: description || '',
      thrustArea,
      uomType,
      targetValue: targetValue ?? '',
      deadline,
      weightage,
      isSharedGoal: !!isSharedGoal,
      approvalStatus: 'draft',
      progressStatus: 'Not Started',
      quarter: quarter || `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
      year: year || new Date().getFullYear(),
      category: category || 'performance',
      priority: priority || 'medium',
    });

    await createAuditLog({
      user: userId,
      action: 'goal_created',
      entity: 'goal',
      entityId: goal._id,
      details: `Goal created: "${title}"`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   GET MY GOALS
   ════════════════════════════════════════════════════════ */
exports.getMyGoals = async (req, res) => {
  try {
    const { approvalStatus, progressStatus } = req.query;
    const filter = { user: req.user._id };
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (progressStatus) filter.progressStatus = progressStatus;

    const goals = await Goal.find(filter)
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Compute live weightage summary
    const totalWeightage   = goals.reduce((s, g) => s + (g.weightage || 0), 0);
    const editableGoals    = goals.filter((g) => ['draft', 'rework'].includes(g.approvalStatus));
    const editableWeight   = editableGoals.reduce((s, g) => s + (g.weightage || 0), 0);
    const canSubmit        = editableWeight === TOTAL_WEIGHT && editableGoals.length > 0;

    res.json({
      success: true,
      data: goals,
      count: goals.length,
      summary: {
        totalGoals:      goals.length,
        maxGoals:        MAX_GOALS,
        totalWeightage,
        editableWeight,
        canSubmit,
        remaining:       TOTAL_WEIGHT - editableWeight,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   GET SINGLE GOAL
   ════════════════════════════════════════════════════════ */
exports.getGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id)
      .populate('user', 'firstName lastName email department')
      .populate('approvedBy', 'firstName lastName');

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Only allow owner or manager/admin
    if (
      goal.user._id.toString() !== req.user._id.toString() &&
      !['manager', 'admin'].includes(req.user.role)
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   UPDATE
   ════════════════════════════════════════════════════════ */
exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Cannot edit if submitted or locked
    if (goal.isLocked || !['draft', 'rework'].includes(goal.approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Goal cannot be edited once submitted or locked.',
      });
    }

    // If returning from rework, allow editing
    let allowedFields = [
      'title', 'description', 'thrustArea', 'uomType',
      'targetValue', 'deadline', 'weightage', 'isSharedGoal',
    ];
    
    // If it's a distributed shared goal, only weightage can be edited by the employee
    if (goal.isSharedGoal && goal.sharedGoalId) {
      allowedFields = ['weightage'];
    }

    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    // Weightage floor check
    if (updates.weightage !== undefined && updates.weightage < MIN_WEIGHT) {
      return res.status(400).json({
        success: false,
        message: `Minimum weightage per goal is ${MIN_WEIGHT}%.`,
      });
    }

    const updated = await Goal.findByIdAndUpdate(
      req.params.id,
      { ...updates, ...(goal.approvalStatus === 'rework' ? { approvalStatus: 'draft' } : {}) },
      { new: true, runValidators: true }
    );

    await createAuditLog({
      user: req.user._id,
      action: 'goal_edited',
      entity: 'goal',
      entityId: goal._id,
      details: `Goal updated: "${goal.title}"`,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   DELETE
   ════════════════════════════════════════════════════════ */
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    if (goal.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Cannot delete if submitted or locked
    if (goal.isLocked || !['draft', 'rework'].includes(goal.approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Goal cannot be deleted once submitted or locked.',
      });
    }

    await Goal.findByIdAndDelete(req.params.id);

    await createAuditLog({
      user: req.user._id,
      action: 'goal_deleted',
      entity: 'goal',
      entityId: goal._id,
      details: `Goal deleted: "${goal.title}"`,
    });

    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   SUBMIT GOAL SHEET
   Validates total editable weightage === 100, then marks
   all draft/rework goals as "submitted".
   ════════════════════════════════════════════════════════ */
exports.submitGoalSheet = async (req, res) => {
  try {
    const userId = req.user._id;

    const editableGoals = await getEditableGoals(userId);

    if (editableGoals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No draft goals to submit.',
      });
    }

    const totalWeight = editableGoals.reduce((s, g) => s + g.weightage, 0);

    if (totalWeight !== TOTAL_WEIGHT) {
      return res.status(400).json({
        success: false,
        message: `Total weightage must be exactly 100%. Current total: ${totalWeight}%.`,
      });
    }

    // Bulk update all editable goals to "submitted"
    await Goal.updateMany(
      { user: userId, approvalStatus: { $in: ['draft', 'rework'] } },
      { $set: { approvalStatus: 'submitted', submittedAt: new Date() } }
    );

    await createAuditLog({
      user: userId,
      action: 'goal_sheet_submitted',
      entity: 'goal',
      details: `Goal sheet submitted — ${editableGoals.length} goal(s), total weightage: ${totalWeight}%`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Goal sheet submitted successfully! ${editableGoals.length} goal(s) sent for manager review.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   UPDATE PROGRESS  (employee, after goal is approved)
   ════════════════════════════════════════════════════════ */
exports.updateProgress = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (goal.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Progress can only be updated on approved goals.',
      });
    }

    const { progressStatus, progressPercent } = req.body;
    const updates = {};
    if (progressStatus) updates.progressStatus = progressStatus;
    if (progressPercent !== undefined) updates.progressPercent = progressPercent;

    const updated = await Goal.findByIdAndUpdate(req.params.id, updates, { new: true });

    await createAuditLog({
      user: req.user._id,
      action: 'goal_progress_updated',
      entity: 'goal',
      entityId: goal._id,
      details: `Progress updated: ${progressStatus ?? ''} (${progressPercent ?? ''}%)`,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   TEAM GOALS  (Manager)
   ════════════════════════════════════════════════════════ */
exports.getTeamGoals = async (req, res) => {
  try {
    const User = require('../models/User');
    const { approvalStatus } = req.query;

    const teamMembers = await User.find({ manager: req.user._id }).select('_id');
    const memberIds   = teamMembers.map((m) => m._id);

    const filter = { user: { $in: memberIds } };
    if (approvalStatus) filter.approvalStatus = approvalStatus;

    const goals = await Goal.find(filter)
      .populate('user', 'firstName lastName email department designation')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: goals, count: goals.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   APPROVE  (Manager)
   ════════════════════════════════════════════════════════ */
exports.approveGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id).populate('user');
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    if (goal.approvalStatus !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Only submitted goals can be approved.' });
    }

    goal.approvalStatus  = 'approved';
    goal.isLocked        = true;
    goal.approvedAt      = new Date();
    goal.approvedBy      = req.user._id;
    goal.managerComment  = req.body.comment || '';
    await goal.save();

    await createAuditLog({
      user: req.user._id,
      action: 'goal_approved',
      entity: 'goal',
      entityId: goal._id,
      details: `Goal approved: "${goal.title}" for ${goal.user.firstName} ${goal.user.lastName}`,
    });

    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   RETURN FOR REWORK  (Manager)
   ════════════════════════════════════════════════════════ */
exports.returnForRework = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id).populate('user');
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    if (goal.approvalStatus !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Only submitted goals can be returned.' });
    }

    if (!req.body.reason) {
      return res.status(400).json({ success: false, message: 'Rework reason is required.' });
    }

    goal.approvalStatus  = 'rework';
    goal.isLocked        = false;
    goal.managerComment  = req.body.reason;
    await goal.save();

    await createAuditLog({
      user: req.user._id,
      action: 'goal_rework',
      entity: 'goal',
      entityId: goal._id,
      details: `Goal returned for rework: "${goal.title}". Reason: ${req.body.reason}`,
    });

    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

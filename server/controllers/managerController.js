const Goal = require('../models/Goal');
const User = require('../models/User');
const createAuditLog = require('../utils/auditLogger');

/* ── helper: fetch direct reports of the manager ── */
const getTeamMemberIds = async (managerId) => {
  const members = await User.find({ manager: managerId, role: 'employee' }).select('_id');
  return members.map((m) => m._id);
};

/* ════════════════════════════════════════════════════
   GET ALL TEAM GOALS  (grouped by employee)
   Returns pending (submitted) goal sheets by default.
   Query ?status=all returns everything.
   ════════════════════════════════════════════════════ */
exports.getTeamGoals = async (req, res) => {
  try {
    const memberIds = await getTeamMemberIds(req.user._id);

    const filter = { user: { $in: memberIds } };
    if (req.query.status && req.query.status !== 'all') {
      filter.approvalStatus = req.query.status;
    }

    const goals = await Goal.find(filter)
      .populate('user', 'firstName lastName email department designation')
      .sort({ submittedAt: -1, createdAt: -1 });

    /* Group by employee */
    const grouped = {};
    goals.forEach((g) => {
      const uid = g.user._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = { employee: g.user, goals: [] };
      }
      grouped[uid].goals.push(g);
    });

    const sheets = Object.values(grouped).map(({ employee, goals: eg }) => {
      const totalWeight    = eg.reduce((s, g) => s + g.weightage, 0);
      const statuses       = [...new Set(eg.map((g) => g.approvalStatus))];
      const sheetStatus    = statuses.length === 1 ? statuses[0] : 'mixed';
      const submittedCount = eg.filter((g) => g.approvalStatus === 'submitted').length;
      const approvedCount  = eg.filter((g) => g.approvalStatus === 'approved').length;
      const reworkCount    = eg.filter((g) => g.approvalStatus === 'rework').length;
      return {
        employee,
        goals: eg,
        totalWeight,
        sheetStatus,
        submittedCount,
        approvedCount,
        reworkCount,
        lastSubmittedAt: eg.find((g) => g.submittedAt)?.submittedAt ?? null,
      };
    });

    res.json({ success: true, data: sheets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════
   GET SINGLE EMPLOYEE'S GOALS
   ════════════════════════════════════════════════════ */
exports.getEmployeeGoals = async (req, res) => {
  try {
    const { employeeId } = req.params;

    /* Ensure employee belongs to this manager */
    const employee = await User.findOne({
      _id: employeeId,
      manager: req.user._id,
    }).select('firstName lastName email department designation');

    if (!employee) {
      return res.status(403).json({
        success: false,
        message: 'Employee not found or not in your team.',
      });
    }

    const goals = await Goal.find({ user: employeeId })
      .sort({ createdAt: -1 });

    const totalWeight    = goals.reduce((s, g) => s + g.weightage, 0);
    const submittedCount = goals.filter((g) => g.approvalStatus === 'submitted').length;
    const approvedCount  = goals.filter((g) => g.approvalStatus === 'approved').length;
    const reworkCount    = goals.filter((g) => g.approvalStatus === 'rework').length;

    res.json({
      success: true,
      employee,
      goals,
      summary: { totalWeight, submittedCount, approvedCount, reworkCount },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════
   INLINE EDIT — targetValue & weightage before approval
   ════════════════════════════════════════════════════ */
exports.editGoalBeforeApproval = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.goalId)
      .populate('user', 'firstName lastName manager');

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }

    /* Ensure the goal belongs to a direct report */
    if (goal.user.manager?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    if (goal.approvalStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Only submitted goals can be edited before approval.',
      });
    }

    const { targetValue, weightage } = req.body;
    const updates = {};
    if (targetValue !== undefined) updates.targetValue = targetValue;
    if (weightage   !== undefined) {
      if (weightage < 10) {
        return res.status(400).json({ success: false, message: 'Minimum weightage is 10%.' });
      }
      updates.weightage = weightage;
    }

    const updated = await Goal.findByIdAndUpdate(req.params.goalId, updates, { new: true });

    await createAuditLog({
      user: req.user._id,
      action: 'manager_goal_edited',
      entity: 'goal',
      entityId: goal._id,
      details: `Manager edited goal "${goal.title}" before approval.`,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════
   APPROVE ENTIRE GOAL SHEET
   Sets all submitted goals → approved + isLocked = true
   ════════════════════════════════════════════════════ */
exports.approveGoalSheet = async (req, res) => {
  try {
    const { employeeId } = req.params;

    /* Authorisation check */
    const employee = await User.findOne({ _id: employeeId, manager: req.user._id });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    const submittedGoals = await Goal.find({
      user: employeeId,
      approvalStatus: 'submitted',
    });

    if (submittedGoals.length === 0) {
      return res.status(400).json({ success: false, message: 'No submitted goals to approve.' });
    }

    /* Validate total weightage equals 100 */
    const totalWeight = submittedGoals.reduce((s, g) => s + g.weightage, 0);
    if (totalWeight !== 100) {
      return res.status(400).json({
        success: false,
        message: `Goal sheet weightage must total 100%. Current: ${totalWeight}%.`,
      });
    }

    await Goal.updateMany(
      { user: employeeId, approvalStatus: 'submitted' },
      {
        $set: {
          approvalStatus : 'approved',
          isLocked       : true,
          approvedAt     : new Date(),
          approvedBy     : req.user._id,
          managerComment : req.body.comment ?? '',
        },
      }
    );

    await createAuditLog({
      user: req.user._id,
      action: 'goal_sheet_approved',
      entity: 'user',
      entityId: employeeId,
      details: `Goal sheet approved for ${employee.firstName} ${employee.lastName}. ${submittedGoals.length} goals locked.`,
    });

    res.json({
      success: true,
      message: `Goal sheet approved! ${submittedGoals.length} goal(s) are now locked.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════
   RETURN GOAL SHEET FOR REWORK
   Sets all submitted goals → rework + isLocked = false
   ════════════════════════════════════════════════════ */
exports.returnGoalSheet = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: 'A rework reason is required.' });
    }

    const employee = await User.findOne({ _id: employeeId, manager: req.user._id });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    const submittedGoals = await Goal.find({
      user: employeeId,
      approvalStatus: 'submitted',
    });

    if (submittedGoals.length === 0) {
      return res.status(400).json({ success: false, message: 'No submitted goals to return.' });
    }

    await Goal.updateMany(
      { user: employeeId, approvalStatus: 'submitted' },
      {
        $set: {
          approvalStatus : 'rework',
          isLocked       : false,
          managerComment : reason,
        },
      }
    );

    await createAuditLog({
      user: req.user._id,
      action: 'goal_sheet_returned',
      entity: 'user',
      entityId: employeeId,
      details: `Goal sheet returned for rework — ${employee.firstName} ${employee.lastName}. Reason: ${reason}`,
    });

    res.json({
      success: true,
      message: `Goal sheet returned for rework. ${submittedGoals.length} goal(s) sent back.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════
   MANAGER DASHBOARD STATS
   ════════════════════════════════════════════════════ */
exports.getManagerDashboard = async (req, res) => {
  try {
    const memberIds = await getTeamMemberIds(req.user._id);

    const [members, goals] = await Promise.all([
      User.find({ manager: req.user._id, role: 'employee' })
          .select('firstName lastName email department designation'),
      Goal.find({ user: { $in: memberIds } }),
    ]);

    /* Unique employees who have at least one submitted goal (pending sheets) */
    const pendingEmployees = [...new Set(
      goals.filter(g => g.approvalStatus === 'submitted').map(g => g.user.toString())
    )].length;

    /* Approved sheets = employees where ALL goals (if any submitted) are approved */
    const approvedEmployees = [...new Set(
      goals.filter(g => g.approvalStatus === 'approved').map(g => g.user.toString())
    )].length;

    const reworkEmployees = [...new Set(
      goals.filter(g => g.approvalStatus === 'rework').map(g => g.user.toString())
    )].length;

    const avgProgress = goals.length
      ? Math.round(goals.reduce((s, g) => s + (g.progressPercent ?? 0), 0) / goals.length)
      : 0;

    res.json({
      success: true,
      data: {
        teamMembers       : members.length,
        pendingApprovals  : pendingEmployees,
        approvedSheets    : approvedEmployees,
        reworkSent        : reworkEmployees,
        avgProgress,
        members,
        recentGoals       : goals
          .filter(g => g.approvalStatus === 'submitted')
          .slice(0, 5),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

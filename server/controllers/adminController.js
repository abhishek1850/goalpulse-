const User        = require('../models/User');
const Goal        = require('../models/Goal');
const Achievement = require('../models/Achievement');
const AuditLog    = require('../models/AuditLog');
const bcrypt      = require('bcryptjs');
const createAuditLog = require('../utils/auditLogger');

/* ════════════════════════════════════════════════════════
   ADMIN DASHBOARD STATS
   ════════════════════════════════════════════════════════ */
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalEmployees,
      totalManagers,
      totalGoals,
      submittedGoals,
      approvedGoals,
      reworkGoals,
      totalAchievements,
      completedGoals,
      totalUsers,
      activeUsers,
    ] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      User.countDocuments({ role: 'manager' }),
      Goal.countDocuments(),
      Goal.countDocuments({ approvalStatus: 'submitted' }),
      Goal.countDocuments({ approvalStatus: 'approved' }),
      Goal.countDocuments({ approvalStatus: 'rework' }),
      Achievement.countDocuments(),
      Goal.countDocuments({ progressStatus: 'Completed' }),
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
    ]);

    // Pending approvals = unique employees with at least one submitted goal
    const pendingEmployees = await Goal.distinct('user', { approvalStatus: 'submitted' });

    // Avg org progress from achievements
    const avgAgg = await Achievement.aggregate([
      { $group: { _id: null, avg: { $avg: '$progressScore' } } },
    ]);
    const avgProgress = avgAgg.length ? Math.round(avgAgg[0].avg) : 0;

    // Goal status distribution
    const goalsByStatus = await Goal.aggregate([
      { $group: { _id: '$approvalStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // UOM type distribution
    const goalsByUom = await Goal.aggregate([
      { $group: { _id: '$uomType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    
    // Goals by category distribution
    const goalsByCategory = await Goal.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Department-wise: avg progress score
    const deptProgress = await Achievement.aggregate([
      {
        $lookup: {
          from        : 'users',
          localField  : 'employee',
          foreignField: '_id',
          as          : 'emp',
        },
      },
      { $unwind: '$emp' },
      {
        $group: {
          _id      : '$emp.department',
          avgScore : { $avg: '$progressScore' },
          count    : { $sum: 1 },
        },
      },
      { $sort: { avgScore: -1 } },
    ]);

    // Quarter-wise avg progress (line chart)
    const quarterProgress = await Achievement.aggregate([
      {
        $group: {
          _id      : { quarter: '$quarter', year: '$year' },
          avgScore : { $avg: '$progressScore' },
          count    : { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.quarter': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        totalManagers,
        totalGoals,
        submittedGoals,
        approvedGoals,
        reworkGoals,
        pendingApprovals  : pendingEmployees.length,
        completedCheckIns : totalAchievements,
        totalCheckins     : totalAchievements,
        completedGoals,
        totalUsers,
        activeUsers,
        avgProgress,
        goalsByStatus,
        goalsByUom,
        goalsByCategory,
        deptProgress,
        quarterProgress,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   GET ALL GOALS  (admin)
   ════════════════════════════════════════════════════════ */
exports.getAllGoals = async (req, res) => {
  try {
    const { approvalStatus, department, quarter, year } = req.query;
    const filter = {};
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (quarter)        filter.quarter        = quarter;
    if (year)           filter.year           = parseInt(year);

    let goals = await Goal.find(filter)
      .populate('user',       'firstName lastName email department designation')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    if (department) {
      goals = goals.filter((g) => g.user?.department === department);
    }

    res.json({ success: true, data: goals, count: goals.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   GET ALL USERS  (admin)
   ════════════════════════════════════════════════════════ */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('manager', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users, count: users.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   CREATE USER  (admin)
   ════════════════════════════════════════════════════════ */
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department, designation, managerId } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({ success: false, message: 'firstName, email, and password are required.' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const user = await User.create({
      firstName,
      lastName : lastName ?? '',
      email,
      password,
      role     : role ?? 'employee',
      department,
      designation,
      manager  : managerId ?? undefined,
    });

    await createAuditLog({
      user     : req.user._id,
      action   : 'user_created',
      entity   : 'user',
      entityId : user._id,
      details  : `Admin created user ${email} with role ${role}.`,
    });

    const created = await User.findById(user._id).select('-password').populate('manager', 'firstName lastName');
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   UPDATE USER ROLE  (admin)
   ════════════════════════════════════════════════════════ */
exports.updateUserRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   ASSIGN MANAGER  (admin)
   ════════════════════════════════════════════════════════ */
exports.assignManager = async (req, res) => {
  try {
    const { managerId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { manager: managerId ?? null },
      { new: true }
    ).select('-password').populate('manager', 'firstName lastName email');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await createAuditLog({
      user     : req.user._id,
      action   : 'manager_assigned',
      entity   : 'user',
      entityId : user._id,
      details  : `Manager ${managerId} assigned to ${user.email}.`,
    });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   TOGGLE USER STATUS  (admin)
   ════════════════════════════════════════════════════════ */
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   UNLOCK GOAL  (admin override)
   ════════════════════════════════════════════════════════ */
exports.unlockGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.goalId);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    goal.isLocked       = false;
    goal.approvalStatus = 'draft';
    await goal.save();

    await createAuditLog({
      user     : req.user._id,
      action   : 'goal_unlocked',
      entity   : 'goal',
      entityId : goal._id,
      details  : `Admin unlocked goal "${goal.title}".`,
    });

    res.json({ success: true, data: goal, message: 'Goal unlocked successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ════════════════════════════════════════════════════════
   GET AUDIT LOGS  (admin)
   ════════════════════════════════════════════════════════ */
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entityType, role, date } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (role) filter.userRole = role;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const logs = await AuditLog.find(filter)
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await AuditLog.countDocuments(filter);
    res.json({
      success: true,
      data    : logs,
      total,
      page    : parseInt(page),
      pages   : Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

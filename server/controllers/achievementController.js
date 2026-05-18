const Achievement = require('../models/Achievement');
const Goal        = require('../models/Goal');
const User        = require('../models/User');
const createAuditLog = require('../utils/auditLogger');

/* ════════════════════════════════════════════════════════
   PROGRESS SCORE FORMULA
   ════════════════════════════════════════════════════════ */
const calcProgressScore = (uomType, targetValue, actualValue, deadline) => {
  let score = 0;
  const actual  = parseFloat(actualValue);
  const target  = parseFloat(targetValue);

  switch (uomType) {
    case 'max':
      // Higher is better: score = actual / target * 100
      if (target > 0) score = (actual / target) * 100;
      break;

    case 'min':
      // Lower is better: score = target / actual * 100
      if (actual > 0) score = (target / actual) * 100;
      else score = 100; // achieved zero — perfect
      break;

    case 'zero':
      // Zero is the goal
      score = actual === 0 ? 100 : 0;
      break;

    case 'timeline': {
      // Completion date vs deadline
      const completionDate = new Date(actualValue);
      const deadlineDate   = new Date(deadline);
      score = completionDate <= deadlineDate ? 100 : 70;
      break;
    }

    default:
      score = 0;
  }

  // Cap at 100
  return Math.min(Math.round(score), 100);
};

/* ════════════════════════════════════════════════════════
   CREATE / UPDATE ACHIEVEMENT   (employee)
   One achievement record per goal per quarter — upsert.
   ════════════════════════════════════════════════════════ */
exports.upsertAchievement = async (req, res) => {
  try {
    const {
      goalId, quarter, year,
      actualValue, progressStatus, employeeComment,
    } = req.body;

    // Load goal and validate ownership + lock
    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }
    if (goal.approvalStatus !== 'approved' || !goal.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Achievements can only be logged for approved and locked goals.',
      });
    }

    // Calculate progress score
    const progressScore = calcProgressScore(
      goal.uomType,
      goal.targetValue,
      actualValue,
      goal.deadline
    );

    // Upsert: one record per goal × quarter × year
    const achievement = await Achievement.findOneAndUpdate(
      { goal: goalId, quarter, year: year ?? new Date().getFullYear() },
      {
        $set: {
          employee      : req.user._id,
          plannedTarget : goal.targetValue || '',
          actualValue,
          progressScore,
          progressStatus,
          employeeComment: employeeComment || '',
          checkInCompleted: true,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Also update goal's progressStatus
    await Goal.findByIdAndUpdate(goalId, { progressStatus });

    // Sync if shared goal & primary owner
    if (goal.isSharedGoal && goal.sharedGoalId) {
      const SharedGoal = require('../models/SharedGoal');
      const sharedDef = await SharedGoal.findById(goal.sharedGoalId);
      if (sharedDef && sharedDef.primaryOwner.toString() === req.user._id.toString()) {
        const linkedGoals = await Goal.find({ sharedGoalId: goal.sharedGoalId, _id: { $ne: goalId } });
        for (const linkedGoal of linkedGoals) {
          await Achievement.findOneAndUpdate(
            { goal: linkedGoal._id, quarter, year: year ?? new Date().getFullYear() },
            {
              $set: {
                employee      : linkedGoal.user,
                plannedTarget : linkedGoal.targetValue || '',
                actualValue,
                progressScore,
                progressStatus,
                employeeComment: employeeComment || '',
                checkInCompleted: true,
              },
            },
            { upsert: true, new: true, runValidators: true }
          );
          await Goal.findByIdAndUpdate(linkedGoal._id, { progressStatus });
        }
      }
    }

    await createAuditLog({
      user     : req.user._id,
      action   : 'achievement_logged',
      entity   : 'achievement',
      entityId : achievement._id,
      details  : `Achievement logged for "${goal.title}" — ${quarter} ${year}: Score ${progressScore}%`,
    });

    res.status(200).json({ success: true, data: achievement });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A check-in for this goal and quarter already exists.',
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════
   GET MY ACHIEVEMENTS   (employee)
   ════════════════════════════════════════════════════════ */
exports.getMyAchievements = async (req, res) => {
  try {
    const { quarter, year } = req.query;
    const filter = { employee: req.user._id };
    if (quarter) filter.quarter = quarter;
    if (year)    filter.year    = parseInt(year);

    const achievements = await Achievement.find(filter)
      .populate('goal', 'title thrustArea uomType targetValue deadline approvalStatus isLocked progressStatus')
      .sort({ createdAt: -1 });

    // Also attach approved goals (for form selector)
    const approvedGoals = await Goal.find({
      user           : req.user._id,
      approvalStatus : 'approved',
      isLocked       : true,
    }).select('title thrustArea uomType targetValue deadline');

    res.json({
      success        : true,
      data           : achievements,
      approvedGoals,
      count          : achievements.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════
   GET TEAM ACHIEVEMENTS   (manager)
   ════════════════════════════════════════════════════════ */
exports.getTeamAchievements = async (req, res) => {
  try {
    const { quarter, year } = req.query;

    const teamMembers = await User.find({ manager: req.user._id }).select('_id');
    const memberIds   = teamMembers.map((m) => m._id);

    const filter = { employee: { $in: memberIds } };
    if (quarter) filter.quarter = quarter;
    if (year)    filter.year    = parseInt(year);

    const achievements = await Achievement.find(filter)
      .populate('employee', 'firstName lastName email department designation')
      .populate('goal',     'title thrustArea uomType targetValue deadline approvalStatus')
      .sort({ quarter: 1, createdAt: -1 });

    res.json({ success: true, data: achievements, count: achievements.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════
   ADD MANAGER COMMENT   (manager)
   ════════════════════════════════════════════════════════ */
exports.addManagerComment = async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
      .populate('employee', 'manager');

    if (!achievement) {
      return res.status(404).json({ success: false, message: 'Achievement not found.' });
    }

    // Verify manager relation
    if (achievement.employee.manager?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    achievement.managerComment    = req.body.managerComment || '';
    achievement.checkInCompleted  = true;
    await achievement.save();

    await createAuditLog({
      user     : req.user._id,
      action   : 'checkin_commented',
      entity   : 'achievement',
      entityId : achievement._id,
      details  : `Manager added check-in comment.`,
    });

    res.json({ success: true, data: achievement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

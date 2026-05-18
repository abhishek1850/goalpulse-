const SharedGoal = require('../models/SharedGoal');
const Goal = require('../models/Goal');
const User = require('../models/User');
const createAuditLog = require('../utils/auditLogger');

exports.createSharedGoal = async (req, res) => {
  try {
    const {
      title,
      description,
      thrustArea,
      uomType,
      targetValue,
      deadline,
      department,
      primaryOwner,
      assignedEmployees,
    } = req.body;

    // Create the SharedGoal definition
    const sharedGoal = await SharedGoal.create({
      title,
      description,
      thrustArea,
      uomType,
      targetValue,
      deadline,
      department,
      primaryOwner,
      createdBy: req.user._id,
      assignedEmployees,
    });

    // Create linked Goal objects for all assigned employees (including primary owner)
    // We give them a default weightage of 10% (min allowed) to let them adjust it later.
    const goalDocs = assignedEmployees.map(empId => ({
      user: empId,
      title,
      description,
      thrustArea,
      uomType,
      targetValue,
      deadline,
      weightage: 10,
      isSharedGoal: true,
      sharedGoalId: sharedGoal._id,
      approvalStatus: 'draft',
      progressStatus: 'Not Started',
    }));

    if (goalDocs.length > 0) {
      await Goal.insertMany(goalDocs);
    }

    await createAuditLog({
      user: req.user._id,
      action: 'shared_goal_created',
      entityType: 'goal',
      entityId: sharedGoal._id,
      description: `Created shared goal: "${title}" for ${assignedEmployees.length} employees`,
    });

    res.status(201).json({ success: true, data: sharedGoal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSharedGoals = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = {};
    if (department) filter.department = department;

    const sharedGoals = await SharedGoal.find(filter)
      .populate('primaryOwner', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('assignedEmployees', 'firstName lastName email department')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: sharedGoals, count: sharedGoals.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

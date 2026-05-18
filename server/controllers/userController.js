const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const { role, department } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    const users = await User.find(filter).select('-password').populate('manager', 'firstName lastName email').sort({ firstName: 1 });
    res.json({ success: true, data: users, count: users.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'manager', isActive: true }).select('firstName lastName email department').sort({ firstName: 1 });
    res.json({ success: true, data: managers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = {};
    ['firstName', 'lastName', 'department', 'designation'].forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignManager = async (req, res) => {
  try {
    const manager = await User.findById(req.body.managerId);
    if (!manager || manager.role !== 'manager') return res.status(400).json({ success: false, message: 'Invalid manager' });
    const user = await User.findByIdAndUpdate(req.params.id, { manager: req.body.managerId }, { new: true }).select('-password').populate('manager', 'firstName lastName email');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

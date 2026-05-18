const router  = require('express').Router();
const auth     = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const {
  getDashboardStats,
  getAllGoals,
  getAllUsers,
  createUser,
  updateUserRole,
  assignManager,
  toggleUserStatus,
  unlockGoal,
  getAuditLogs,
} = require('../controllers/adminController');

const guard = [auth, roleAuth('admin')];

router.get ('/dashboard',                ...guard, getDashboardStats);
router.get ('/goals',                    ...guard, getAllGoals);
router.get ('/users',                    ...guard, getAllUsers);
router.post('/users',                    ...guard, createUser);
router.put ('/users/:id/role',           ...guard, updateUserRole);
router.put ('/users/:id/assign-manager', ...guard, assignManager);
router.put ('/users/:id/toggle-status',  ...guard, toggleUserStatus);
router.put ('/goals/:goalId/unlock',     ...guard, unlockGoal);
router.get ('/audit-logs',               ...guard, getAuditLogs);

module.exports = router;

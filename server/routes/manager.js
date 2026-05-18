const router  = require('express').Router();
const auth     = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const {
  getManagerDashboard,
  getTeamGoals,
  getEmployeeGoals,
  editGoalBeforeApproval,
  approveGoalSheet,
  returnGoalSheet,
} = require('../controllers/managerController');

const guard = [auth, roleAuth('manager', 'admin')];

router.get ('/',                                    ...guard, getManagerDashboard);
router.get ('/team-goals',                          ...guard, getTeamGoals);
router.get ('/employee/:employeeId/goals',          ...guard, getEmployeeGoals);
router.put ('/goals/:goalId/edit',                  ...guard, editGoalBeforeApproval);
router.put ('/employee/:employeeId/approve-sheet',  ...guard, approveGoalSheet);
router.put ('/employee/:employeeId/return-sheet',   ...guard, returnGoalSheet);

module.exports = router;

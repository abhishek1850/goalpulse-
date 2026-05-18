const router = require('express').Router();
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { createSharedGoal, getSharedGoals } = require('../controllers/sharedGoalController');

// Only Admin or Manager can access
router.post('/', auth, roleAuth('admin', 'manager'), createSharedGoal);
router.get('/', auth, roleAuth('admin', 'manager'), getSharedGoals);

module.exports = router;

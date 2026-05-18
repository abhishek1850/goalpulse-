const router = require('express').Router();
const auth     = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const {
  createGoal, getMyGoals, getGoal, updateGoal, deleteGoal,
  submitGoalSheet, updateProgress,
  getTeamGoals, approveGoal, returnForRework,
} = require('../controllers/goalController');

/* ── Employee ──────────────────────────────────────── */
router.post('/',                auth, createGoal);
router.get('/',                 auth, getMyGoals);
router.get('/team',             auth, roleAuth('manager', 'admin'), getTeamGoals);
router.get('/:id',              auth, getGoal);
router.put('/:id',              auth, updateGoal);
router.delete('/:id',           auth, deleteGoal);
router.post('/submit-sheet',    auth, submitGoalSheet);        // submit entire goal sheet
router.put('/:id/progress',     auth, updateProgress);

/* ── Manager ───────────────────────────────────────── */
router.put('/:id/approve',      auth, roleAuth('manager', 'admin'), approveGoal);
router.put('/:id/rework',       auth, roleAuth('manager', 'admin'), returnForRework);

module.exports = router;

const router  = require('express').Router();
const auth     = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const {
  upsertAchievement,
  getMyAchievements,
  getTeamAchievements,
  addManagerComment,
} = require('../controllers/achievementController');

// Employee
router.post ('/',            auth,                                upsertAchievement);
router.get  ('/',            auth,                                getMyAchievements);

// Manager
router.get  ('/team',        auth, roleAuth('manager', 'admin'), getTeamAchievements);
router.put  ('/:id/comment', auth, roleAuth('manager', 'admin'), addManagerComment);

module.exports = router;

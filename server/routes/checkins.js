const router = require('express').Router();
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { createCheckIn, getMyCheckIns, getTeamCheckIns, reviewCheckIn } = require('../controllers/checkinController');

router.post('/', auth, createCheckIn);
router.get('/', auth, getMyCheckIns);
router.get('/team', auth, roleAuth('manager', 'admin'), getTeamCheckIns);
router.put('/:id/review', auth, roleAuth('manager', 'admin'), reviewCheckIn);

module.exports = router;

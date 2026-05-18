const router = require('express').Router();
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { getUsers, getManagers, updateProfile, assignManager } = require('../controllers/userController');

router.get('/', auth, getUsers);
router.get('/managers', auth, getManagers);
router.put('/profile', auth, updateProfile);
router.put('/:id/assign-manager', auth, roleAuth('admin', 'manager'), assignManager);

module.exports = router;

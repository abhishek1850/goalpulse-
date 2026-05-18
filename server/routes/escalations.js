const express = require('express');
const router = express.Router();
const { getEscalations, triggerNotification } = require('../controllers/escalationController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

router.use(auth);
router.use(roleAuth('admin'));

router.get('/', getEscalations);
router.post('/notify', triggerNotification);

module.exports = router;

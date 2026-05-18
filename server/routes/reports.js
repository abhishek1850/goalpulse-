const express = require('express');
const router = express.Router();
const { getAchievementReport, exportAchievementReportCsv } = require('../controllers/reportController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

router.use(auth);
router.use(roleAuth('admin'));

router.get('/achievements', getAchievementReport);
router.get('/achievements/export-csv', exportAchievementReportCsv);

module.exports = router;

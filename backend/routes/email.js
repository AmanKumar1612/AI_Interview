const express = require('express');
const router = express.Router();
const { sendReport } = require('../controllers/emailController');
const { protect } = require('../middleware/auth');

router.post('/send-report', protect, sendReport);

module.exports = router;

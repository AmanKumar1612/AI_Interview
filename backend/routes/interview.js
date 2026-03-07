const express = require('express');
const router = express.Router();
const { generateQuestions, evaluateAnswer, saveInterview, getHistory, getInterview } = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');

router.use(protect); // All interview routes are protected

router.post('/generate-questions', generateQuestions);
router.post('/evaluate-answer', evaluateAnswer);
router.post('/save', saveInterview);
router.get('/history', getHistory);
router.get('/:id', getInterview);

module.exports = router;

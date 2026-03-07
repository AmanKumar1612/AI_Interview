const express = require('express');
const multer = require('multer');
const router = express.Router();
const { analyzeResume, getResumeHistory, getResume } = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');

// Store file in memory (buffer) — no disk needed
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed'), false);
    },
});

router.use(protect);

router.post('/analyze', upload.single('resume'), analyzeResume);
router.get('/history', getResumeHistory);
router.get('/:id', getResume);

module.exports = router;

const nodemailer = require('nodemailer');
const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const { buildEmailHTML } = require('../utils/emailTemplate');

// @route POST /api/email/send-report
const sendReport = async (req, res) => {
    const { interviewId, resumeId, recipientEmail } = req.body;

    if (!interviewId || !recipientEmail) {
        return res.status(400).json({ success: false, message: 'Interview ID and recipient email are required' });
    }

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user._id });
    if (!interview) {
        return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    let resume = null;
    if (resumeId) {
        resume = await Resume.findOne({ _id: resumeId, userId: req.user._id }).select('-extractedText');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const htmlContent = buildEmailHTML(interview, resume, req.user);

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: recipientEmail,
        subject: `🎯 Your AI Interview Report — ${interview.role} | Score: ${interview.overallScore}/100`,
        html: htmlContent,
    });

    res.json({ success: true, message: `Report sent to ${recipientEmail}` });
};

module.exports = { sendReport };

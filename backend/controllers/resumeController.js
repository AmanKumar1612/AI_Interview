const pdfParse = require('pdf-parse');
const { llmChat, parseLLMJson } = require('../utils/llm');
const Resume = require('../models/Resume');

// @route POST /api/resume/analyze
const analyzeResume = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'PDF file is required' });
    }

    const { jobDescription, jobTitle } = req.body;
    if (!jobDescription) {
        return res.status(400).json({ success: false, message: 'Job description is required' });
    }

    // Extract text from PDF buffer
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length < 50) {
        return res.status(400).json({ success: false, message: 'Could not extract text from PDF. Please upload a text-based PDF.' });
    }

    const systemPrompt = `You are an ATS (Applicant Tracking System) expert. Return ONLY valid JSON.`;

    const userPrompt = `You are an ATS system.
Compare the Job Description and Resume below.
Extract key skills, calculate match percentage, and give actionable suggestions.

Job Title: ${jobTitle || 'Not specified'}

Job Description:
${jobDescription}

Resume Text:
${resumeText.substring(0, 4000)}

Return this exact JSON structure:
{
  "ats_score": 78,
  "matchedSkills": ["React", "Node.js", "MongoDB"],
  "missingSkills": ["Docker", "Kubernetes", "AWS"],
  "keyStrengths": ["Strong frontend experience", "5+ years of experience"],
  "suggestions": [
    "Add Docker and containerization skills to match JD requirements",
    "Include specific metrics for project achievements",
    "Add a dedicated skills section at the top of resume"
  ],
  "overallFeedback": "Your resume is a good match for this role. Focus on adding cloud deployment skills to improve ATS score."
}`;

    const raw = await llmChat(systemPrompt, userPrompt);
    const analysis = parseLLMJson(raw);

    const resume = await Resume.create({
        userId: req.user._id,
        filename: req.file.originalname,
        originalName: req.file.originalname,
        jobDescription,
        jobTitle: jobTitle || '',
        extractedText: resumeText.substring(0, 5000),
        atsScore: analysis.ats_score || 0,
        matchedSkills: analysis.matchedSkills || [],
        missingSkills: analysis.missingSkills || [],
        suggestions: analysis.suggestions || [],
        keyStrengths: analysis.keyStrengths || [],
        overallFeedback: analysis.overallFeedback || '',
    });

    res.status(201).json({ success: true, resume });
};

// @route GET /api/resume/history
const getResumeHistory = async (req, res) => {
    const resumes = await Resume.find({ userId: req.user._id })
        .select('-extractedText')
        .sort({ createdAt: -1 })
        .limit(10);

    res.json({ success: true, resumes });
};

// @route GET /api/resume/:id
const getResume = async (req, res) => {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id }).select('-extractedText');
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, resume });
};

module.exports = { analyzeResume, getResumeHistory, getResume };

const { llmChat, parseLLMJson } = require('../utils/llm');
const Interview = require('../models/Interview');

// ── Generate role-based interview questions ─────────────────────────────────
// @route POST /api/interview/generate-questions
const generateQuestions = async (req, res) => {
    const { role, level, skills } = req.body;

    if (!role || !level) {
        return res.status(400).json({ success: false, message: 'Role and level are required' });
    }

    const systemPrompt = `You are a professional technical interviewer. Return ONLY valid JSON.`;

    const userPrompt = `Generate exactly 5 interview questions for the following:
Role: ${role}
Experience Level: ${level}
Skills: ${skills?.join(', ') || 'General'}

Requirements:
- Questions should increase in difficulty (Q1 easy → Q5 hard)
- Mix conceptual, practical, and problem-solving questions
- Each question must have expected keywords/concepts

Return this exact JSON structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here",
      "difficulty": "easy",
      "expectedKeywords": ["keyword1", "keyword2", "keyword3"],
      "topic": "Topic area"
    }
  ]
}`;

    const raw = await llmChat(systemPrompt, userPrompt);
    const data = parseLLMJson(raw);

    res.json({ success: true, questions: data.questions });
};

// ── Evaluate a single answer ────────────────────────────────────────────────
// @route POST /api/interview/evaluate-answer
const evaluateAnswer = async (req, res) => {
    const { question, expectedKeywords, answer } = req.body;

    if (!question || !answer) {
        return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }

    const systemPrompt = `You are an expert technical interviewer and evaluator. Return ONLY valid JSON.`;

    const userPrompt = `You are an expert technical interviewer.
Evaluate the candidate answer below.

Question: ${question}
Expected Concepts: ${expectedKeywords?.join(', ') || 'N/A'}
Candidate Answer: ${answer}

Score each dimension from 0-10 and calculate overall score (0-100).
Be constructive and specific in feedback.

Return this exact JSON structure:
{
  "scores": {
    "technicalAccuracy": 8,
    "completeness": 7,
    "clarity": 9,
    "confidence": 7,
    "relevance": 8
  },
  "overall": 78,
  "missedTopics": ["topic1", "topic2"],
  "feedback": "Detailed feedback here",
  "improvementSuggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "strengths": ["Strength 1", "Strength 2"]
}`;

    const raw = await llmChat(systemPrompt, userPrompt);
    const evaluation = parseLLMJson(raw);

    res.json({ success: true, evaluation });
};

// ── Save completed interview ────────────────────────────────────────────────
// @route POST /api/interview/save
const saveInterview = async (req, res) => {
    const { role, experienceLevel, skills, questionAnswers, overallScore, duration } = req.body;

    // Compute strengths and weaknesses from scores
    const allScores = questionAnswers.flatMap((qa) => {
        if (!qa.score) return [];
        return qa.score.strengths || [];
    });
    const allMissed = questionAnswers.flatMap((qa) => qa.score?.missedTopics || []);

    const interview = await Interview.create({
        userId: req.user._id,
        role,
        experienceLevel,
        skills: skills || [],
        questionAnswers,
        overallScore: overallScore || 0,
        strengths: [...new Set(allScores)],
        weaknesses: [...new Set(allMissed)],
        status: 'completed',
        duration: duration || 0,
    });

    res.status(201).json({ success: true, interview });
};

// ── Get interview history for logged-in user ────────────────────────────────
// @route GET /api/interview/history
const getHistory = async (req, res) => {
    const interviews = await Interview.find({ userId: req.user._id })
        .select('-questionAnswers')
        .sort({ createdAt: -1 })
        .limit(20);

    res.json({ success: true, interviews });
};

// ── Get single interview with full detail ────────────────────────────────────
// @route GET /api/interview/:id
const getInterview = async (req, res) => {
    const interview = await Interview.findOne({
        _id: req.params.id,
        userId: req.user._id,
    });

    if (!interview) {
        return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    res.json({ success: true, interview });
};

module.exports = { generateQuestions, evaluateAnswer, saveInterview, getHistory, getInterview };

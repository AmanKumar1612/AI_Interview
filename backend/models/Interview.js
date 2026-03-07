const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    expectedKeywords: [String],
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
});

const scoreSchema = new mongoose.Schema({
    technicalAccuracy: { type: Number, min: 0, max: 10, default: 0 },
    completeness: { type: Number, min: 0, max: 10, default: 0 },
    clarity: { type: Number, min: 0, max: 10, default: 0 },
    confidence: { type: Number, min: 0, max: 10, default: 0 },
    relevance: { type: Number, min: 0, max: 10, default: 0 },
    overall: { type: Number, min: 0, max: 100, default: 0 },
    missedTopics: [String],
    feedback: { type: String, default: '' },
    improvementSuggestions: [String],
});

const questionAnswerSchema = new mongoose.Schema({
    question: questionSchema,
    answer: { type: String, default: '' },
    score: scoreSchema,
});

const interviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        role: { type: String, required: true, trim: true },
        experienceLevel: {
            type: String,
            enum: ['junior', 'mid', 'senior', 'lead'],
            default: 'mid',
        },
        skills: [String],
        questionAnswers: [questionAnswerSchema],
        overallScore: { type: Number, min: 0, max: 100, default: 0 },
        strengths: [String],
        weaknesses: [String],
        status: {
            type: String,
            enum: ['in-progress', 'completed'],
            default: 'completed',
        },
        duration: { type: Number, default: 0 }, // minutes
    },
    { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);

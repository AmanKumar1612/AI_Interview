const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        jobDescription: { type: String, required: true },
        jobTitle: { type: String, default: '' },
        extractedText: { type: String, required: true },
        atsScore: { type: Number, min: 0, max: 100, default: 0 },
        matchedSkills: [String],
        missingSkills: [String],
        suggestions: [String],
        keyStrengths: [String],
        overallFeedback: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);

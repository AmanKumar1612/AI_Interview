const Interview = require('../models/Interview');
const Resume = require('../models/Resume');

// @route GET /api/dashboard
const getDashboard = async (req, res) => {
    const userId = req.user._id;

    const [interviews, resumes] = await Promise.all([
        Interview.find({ userId }).sort({ createdAt: -1 }).limit(20),
        Resume.find({ userId }).select('-extractedText').sort({ createdAt: -1 }).limit(10),
    ]);

    const totalInterviews = interviews.length;
    const avgScore =
        totalInterviews > 0
            ? Math.round(interviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / totalInterviews)
            : 0;

    const latestResume = resumes[0] || null;

    // Score history for chart (last 10 interviews)
    const scoreHistory = interviews.slice(0, 10).reverse().map((i) => ({
        date: i.createdAt,
        score: i.overallScore,
        role: i.role,
    }));

    // Aggregate skill strengths/weaknesses across interviews
    const allStrengths = interviews.flatMap((i) => i.strengths || []);
    const allWeaknesses = interviews.flatMap((i) => i.weaknesses || []);

    const countFrequency = (arr) => {
        const freq = {};
        arr.forEach((item) => { freq[item] = (freq[item] || 0) + 1; });
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic, count]) => ({ topic, count }));
    };

    // Average scores per dimension across all interviews
    let dimensionTotals = { technicalAccuracy: 0, completeness: 0, clarity: 0, confidence: 0, relevance: 0 };
    let dimensionCount = 0;

    interviews.forEach((interview) => {
        if (interview.questionAnswers) {
            interview.questionAnswers.forEach((qa) => {
                if (qa.score) {
                    dimensionTotals.technicalAccuracy += qa.score.technicalAccuracy || 0;
                    dimensionTotals.completeness += qa.score.completeness || 0;
                    dimensionTotals.clarity += qa.score.clarity || 0;
                    dimensionTotals.confidence += qa.score.confidence || 0;
                    dimensionTotals.relevance += qa.score.relevance || 0;
                    dimensionCount++;
                }
            });
        }
    });

    const avgDimensions =
        dimensionCount > 0
            ? {
                technicalAccuracy: +(dimensionTotals.technicalAccuracy / dimensionCount).toFixed(1),
                completeness: +(dimensionTotals.completeness / dimensionCount).toFixed(1),
                clarity: +(dimensionTotals.clarity / dimensionCount).toFixed(1),
                confidence: +(dimensionTotals.confidence / dimensionCount).toFixed(1),
                relevance: +(dimensionTotals.relevance / dimensionCount).toFixed(1),
            }
            : { technicalAccuracy: 0, completeness: 0, clarity: 0, confidence: 0, relevance: 0 };

    res.json({
        success: true,
        stats: {
            totalInterviews,
            avgScore,
            latestAtsScore: latestResume?.atsScore || 0,
            resumeCount: resumes.length,
        },
        scoreHistory,
        avgDimensions,
        topStrengths: countFrequency(allStrengths),
        topWeaknesses: countFrequency(allWeaknesses),
        recentInterviews: interviews.slice(0, 5).map((i) => ({
            id: i._id,
            role: i.role,
            level: i.experienceLevel,
            score: i.overallScore,
            date: i.createdAt,
        })),
        recentResumes: resumes.slice(0, 3).map((r) => ({
            id: r._id,
            jobTitle: r.jobTitle,
            atsScore: r.atsScore,
            date: r.createdAt,
        })),
    });
};

module.exports = { getDashboard };

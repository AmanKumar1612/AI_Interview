import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { interviewAPI, emailAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    Chart as ChartJS,
    RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Trophy, ChevronDown, ChevronUp, Mail, Loader2, BarChart3, Target, TrendingUp } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const scoreColor = (s) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400';
const scoreBg = (s) => s >= 80 ? 'bg-green-400/15 border-green-400/30' : s >= 60 ? 'bg-yellow-400/15 border-yellow-400/30' : 'bg-red-400/15 border-red-400/30';

const ResultsPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedQ, setExpandedQ] = useState(null);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailAddr, setEmailAddr] = useState('');

    useEffect(() => {
        interviewAPI.getInterview(id)
            .then((res) => setInterview(res.data.interview))
            .catch(() => toast.error('Failed to load results'))
            .finally(() => setLoading(false));
    }, [id]);

    const sendEmail = async () => {
        if (!emailAddr) { toast.error('Enter an email address'); return; }
        setEmailLoading(true);
        try {
            await emailAPI.sendReport({ interviewId: id, recipientEmail: emailAddr });
            toast.success('Report sent! Check your inbox.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send email');
        } finally {
            setEmailLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
    );
    if (!interview) return <div className="text-center py-20 text-slate-400">Interview not found.</div>;

    const qaWithScores = interview.questionAnswers?.filter((qa) => qa.score?.overall > 0) || [];
    const avg = (key) => {
        const vals = qaWithScores.map((qa) => qa.score?.[key] || 0);
        return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
    };

    const radarData = {
        labels: ['Technical', 'Completeness', 'Clarity', 'Confidence', 'Relevance'],
        datasets: [{
            label: 'Score /10',
            data: [avg('technicalAccuracy'), avg('completeness'), avg('clarity'), avg('confidence'), avg('relevance')],
            backgroundColor: 'rgba(99,102,241,0.25)',
            borderColor: '#6366f1',
            pointBackgroundColor: '#818cf8',
            pointBorderColor: '#fff',
            borderWidth: 2,
        }],
    };
    const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                min: 0, max: 10,
                ticks: { stepSize: 2, color: '#475569', backdropColor: 'transparent' },
                grid: { color: '#1e293b' },
                pointLabels: { color: '#94a3b8', font: { size: 12 } },
                angleLines: { color: '#1e293b' },
            },
        },
        plugins: { legend: { display: false } },
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <Trophy size={36} className="text-white" />
                </div>
                <h1 className="text-3xl font-black text-white">Interview Results</h1>
                <p className="text-slate-400 mt-1">{interview.role} • <span className="capitalize">{interview.experienceLevel}</span></p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className={`glass-card text-center border ${scoreBg(interview.overallScore)}`}>
                    <div className={`text-4xl font-black ${scoreColor(interview.overallScore)}`}>{interview.overallScore}</div>
                    <div className="text-xs text-slate-500 mt-1">Overall Score</div>
                </div>
                <div className="glass-card text-center"><div className="text-2xl font-bold text-primary-400">{interview.questionAnswers?.length || 0}</div><div className="text-xs text-slate-500 mt-1">Questions</div></div>
                <div className="glass-card text-center"><div className="text-2xl font-bold text-emerald-400">{interview.duration || 0}m</div><div className="text-xs text-slate-500 mt-1">Duration</div></div>
                <div className="glass-card text-center"><div className="text-2xl font-bold text-yellow-400">{qaWithScores.filter((qa) => qa.score?.overall >= 70).length}/{interview.questionAnswers?.length || 0}</div><div className="text-xs text-slate-500 mt-1">Good Answers</div></div>
            </div>

            {/* Radar Chart */}
            <div className="glass-card">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-primary-400" /> Performance Breakdown</h2>
                <div className="h-64">
                    <Radar data={radarData} options={radarOptions} />
                </div>
            </div>

            {/* Q&A breakdown */}
            <div className="space-y-3">
                <h2 className="font-bold text-white flex items-center gap-2"><Target size={18} className="text-primary-400" /> Question-by-Question</h2>
                {(interview.questionAnswers || []).map((qa, i) => (
                    <div key={i} className="glass-card !py-0 overflow-hidden">
                        <button
                            className="w-full flex items-center justify-between px-5 py-4 text-left"
                            onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 border ${scoreBg(qa.score?.overall || 0)}`}>
                                    <span className={scoreColor(qa.score?.overall || 0)}>{i + 1}</span>
                                </div>
                                <span className="text-sm text-slate-300 truncate">{qa.question?.question}</span>
                            </div>
                            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                <span className={`font-bold text-sm ${scoreColor(qa.score?.overall || 0)}`}>{qa.score?.overall || 0}/100</span>
                                {expandedQ === i ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                            </div>
                        </button>

                        {expandedQ === i && (
                            <div className="border-t border-surface-700 px-5 py-4 space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {['technicalAccuracy', 'completeness', 'clarity', 'confidence', 'relevance'].map((dim) => (
                                        <span key={dim} className="px-3 py-1 rounded-full bg-surface-700 text-xs text-slate-300">
                                            {dim.replace(/([A-Z])/g, ' $1')}: <strong>{qa.score?.[dim] || 0}/10</strong>
                                        </span>
                                    ))}
                                </div>
                                {qa.answer && qa.answer !== '[Skipped]' && (
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wide">Your Answer</p>
                                        <p className="text-sm text-slate-300 bg-surface-800/50 rounded-lg p-3 leading-relaxed">{qa.answer}</p>
                                    </div>
                                )}
                                {qa.score?.feedback && (
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wide">AI Feedback</p>
                                        <p className="text-sm text-slate-300 leading-relaxed">{qa.score.feedback}</p>
                                    </div>
                                )}
                                {qa.score?.improvementSuggestions?.length > 0 && (
                                    <div>
                                        <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wide">Improvement Suggestions</p>
                                        <ul className="space-y-1">
                                            {qa.score.improvementSuggestions.map((s, j) => (
                                                <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                                                    <TrendingUp size={13} className="mt-0.5 text-primary-400 flex-shrink-0" /> {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {qa.score?.missedTopics?.length > 0 && (
                                    <div>
                                        <p className="text-xs text-red-400 mb-2 font-semibold uppercase tracking-wide">Missed Concepts</p>
                                        <div className="flex flex-wrap gap-2">
                                            {qa.score.missedTopics.map((t) => (
                                                <span key={t} className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Email report */}
            <div className="glass-card">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2"><Mail size={18} className="text-primary-400" /> Email Performance Report</h2>
                <div className="flex gap-3 flex-wrap">
                    <input type="email" value={emailAddr} onChange={(e) => setEmailAddr(e.target.value)}
                        placeholder={user?.email || 'your@email.com'} className="input-field flex-1" />
                    <button onClick={sendEmail} disabled={emailLoading} className="btn-primary flex items-center gap-2">
                        {emailLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                        Send Report
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 flex-wrap pb-8">
                <Link to="/interview/setup" className="btn-primary flex-1 text-center">Start New Interview</Link>
                <Link to="/dashboard" className="btn-secondary flex-1 text-center">Go to Dashboard</Link>
            </div>
        </div>
    );
};

export default ResultsPage;

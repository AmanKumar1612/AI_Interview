import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Chart as ChartJS,
    RadialLinearScale, PointElement, LineElement, Filler,
    CategoryScale, LinearScale, Tooltip, Legend
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';
import { LayoutDashboard, Mic, FileSearch, TrendingUp, TrendingDown, Loader2, ChevronRight, Award, BarChart3 } from 'lucide-react';

ChartJS.register(
    RadialLinearScale, PointElement, LineElement, Filler,
    CategoryScale, LinearScale, Tooltip, Legend
);

const scoreColor = (s) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400';

const DashboardPage = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dashboardAPI.getDashboard()
            .then((res) => setData(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 size={40} className="animate-spin text-primary-500" />
        </div>
    );

    const isEmpty = !data || data.stats?.totalInterviews === 0;

    const radarData = {
        labels: ['Technical', 'Completeness', 'Clarity', 'Confidence', 'Relevance'],
        datasets: [{
            label: 'Avg Score /10',
            data: data?.avgDimensions
                ? [
                    data.avgDimensions.technicalAccuracy,
                    data.avgDimensions.completeness,
                    data.avgDimensions.clarity,
                    data.avgDimensions.confidence,
                    data.avgDimensions.relevance,
                ]
                : [0, 0, 0, 0, 0],
            backgroundColor: 'rgba(99,102,241,0.25)',
            borderColor: '#6366f1',
            pointBackgroundColor: '#818cf8',
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
                pointLabels: { color: '#94a3b8', font: { size: 11 } },
                angleLines: { color: '#1e293b' },
            },
        },
        plugins: { legend: { display: false } },
    };

    const scoreHistory = (data?.scoreHistory || []).slice(0, 10).reverse();
    const lineData = {
        labels: scoreHistory.map((h) => new Date(h.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })),
        datasets: [{
            label: 'Score',
            data: scoreHistory.map((h) => h.score),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#6366f1',
            pointRadius: 4,
            borderWidth: 2.5,
        }],
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { min: 0, max: 100, ticks: { color: '#64748b', stepSize: 20 }, grid: { color: '#1e293b' } },
            x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderWidth: 1,
                titleColor: '#f1f5f9',
                bodyColor: '#94a3b8',
                callbacks: { label: (ctx) => ` ${ctx.parsed.y}/100` },
            },
        },
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                        <LayoutDashboard size={28} className="text-primary-400" /> Dashboard
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">Welcome back, {user?.name?.split(' ')[0]} 👋</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/interview/setup" className="btn-primary flex items-center gap-2 text-sm"><Mic size={16} /> New Interview</Link>
                    <Link to="/resume" className="btn-secondary flex items-center gap-2 text-sm"><FileSearch size={16} /> Analyze Resume</Link>
                </div>
            </div>

            {/* Empty state */}
            {isEmpty ? (
                <div className="glass-card text-center py-20">
                    <BarChart3 size={48} className="mx-auto text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">No interviews yet</h2>
                    <p className="text-slate-400 mb-6">Start your first AI interview to see analytics here.</p>
                    <Link to="/interview/setup" className="btn-primary inline-flex items-center gap-2"><Mic size={16} /> Start Interview <ChevronRight size={16} /></Link>
                </div>
            ) : (
                <>
                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Interviews', value: data.stats.totalInterviews, icon: Mic, color: 'text-primary-400' },
                            { label: 'Avg Score', value: `${data.stats.avgScore}/100`, icon: Award, color: scoreColor(data.stats.avgScore) },
                            { label: 'Latest ATS Score', value: `${data.stats.latestAtsScore}/100`, icon: FileSearch, color: scoreColor(data.stats.latestAtsScore) },
                            { label: 'Resumes Analyzed', value: data.stats.resumeCount, icon: BarChart3, color: 'text-accent-400' },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="glass-card">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-500">{label}</span>
                                    <Icon size={16} className={color} />
                                </div>
                                <div className={`text-2xl font-black ${color}`}>{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Charts row */}
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="glass-card">
                            <h2 className="font-bold text-white mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-primary-400" /> Avg Performance</h2>
                            <div className="h-56">
                                <Radar data={radarData} options={radarOptions} />
                            </div>
                        </div>
                        <div className="glass-card">
                            <h2 className="font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-primary-400" /> Score History</h2>
                            <div className="h-56">
                                {scoreHistory.length > 0 ? (
                                    <Line data={lineData} options={lineOptions} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">Not enough data yet</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    {(data.topStrengths?.length > 0 || data.topWeaknesses?.length > 0) && (
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="glass-card">
                                <h2 className="font-bold text-green-400 flex items-center gap-2 mb-4"><TrendingUp size={16} /> Top Strengths</h2>
                                <ul className="space-y-2">
                                    {(data.topStrengths || []).map(({ topic, count }) => (
                                        <li key={topic} className="flex items-center justify-between">
                                            <span className="text-sm text-slate-300">{topic}</span>
                                            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">×{count}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="glass-card">
                                <h2 className="font-bold text-red-400 flex items-center gap-2 mb-4"><TrendingDown size={16} /> Areas to Improve</h2>
                                <ul className="space-y-2">
                                    {(data.topWeaknesses || []).map(({ topic, count }) => (
                                        <li key={topic} className="flex items-center justify-between">
                                            <span className="text-sm text-slate-300">{topic}</span>
                                            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">×{count}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Recent interviews table */}
                    {data.recentInterviews?.length > 0 && (
                        <div className="glass-card overflow-hidden">
                            <h2 className="font-bold text-white mb-4">Recent Interviews</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-surface-700 text-slate-500">
                                            <th className="text-left py-2 pr-4 font-medium">Role</th>
                                            <th className="text-left py-2 pr-4 font-medium">Level</th>
                                            <th className="text-left py-2 pr-4 font-medium">Score</th>
                                            <th className="text-left py-2 font-medium">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.recentInterviews.map((i) => (
                                            <tr key={i.id} className="border-b border-surface-800 hover:bg-surface-800/40 transition-colors">
                                                <td className="py-3 pr-4"><Link to={`/interview/results/${i.id}`} className="text-slate-200 hover:text-primary-400 transition-colors">{i.role}</Link></td>
                                                <td className="py-3 pr-4 text-slate-400 capitalize">{i.level}</td>
                                                <td className="py-3 pr-4"><span className={`font-bold ${scoreColor(i.score)}`}>{i.score}/100</span></td>
                                                <td className="py-3 text-slate-500">{new Date(i.date).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DashboardPage;

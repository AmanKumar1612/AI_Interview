import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Mic, Briefcase, Award, Code, Plus, X, ChevronRight, Loader2 } from 'lucide-react';

const ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer', 'Software Engineer', 'React Developer', 'Node.js Developer', 'Python Developer'];
const LEVELS = [
    { value: 'junior', label: 'Junior', desc: '0–2 years', color: 'text-green-400' },
    { value: 'mid', label: 'Mid-Level', desc: '2–5 years', color: 'text-blue-400' },
    { value: 'senior', label: 'Senior', desc: '5–8 years', color: 'text-purple-400' },
    { value: 'lead', label: 'Lead / Principal', desc: '8+ years', color: 'text-orange-400' },
];

const InterviewSetupPage = () => {
    const [form, setForm] = useState({ role: '', level: 'mid', skills: [] });
    const [skillInput, setSkillInput] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const addSkill = () => {
        const s = skillInput.trim();
        if (s && !form.skills.includes(s) && form.skills.length < 10) {
            setForm({ ...form, skills: [...form.skills, s] });
            setSkillInput('');
        }
    };
    const removeSkill = (s) => setForm({ ...form, skills: form.skills.filter((x) => x !== s) });
    const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } };

    const handleStart = async () => {
        if (!form.role) { toast.error('Please enter or select a role'); return; }
        setLoading(true);
        try {
            const { data } = await interviewAPI.generateQuestions(form);
            // Store questions and setup in sessionStorage for InterviewPage
            sessionStorage.setItem('interviewSetup', JSON.stringify({ ...form, questions: data.questions }));
            navigate('/interview/live');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate questions');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Mic size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">Interview Setup</h1>
                <p className="text-slate-400">Configure your mock interview session</p>
            </div>

            <div className="glass-card space-y-8">
                {/* Role */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
                        <Briefcase size={16} className="text-primary-400" /> Job Role *
                    </label>
                    <input
                        id="role"
                        type="text"
                        list="roles-list"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        placeholder="e.g. Frontend Developer"
                        className="input-field"
                    />
                    <datalist id="roles-list">
                        {ROLES.map((r) => <option key={r} value={r} />)}
                    </datalist>
                </div>

                {/* Experience Level */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
                        <Award size={16} className="text-primary-400" /> Experience Level
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {LEVELS.map(({ value, label, desc, color }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setForm({ ...form, level: value })}
                                className={`p-3 rounded-xl border text-left transition-all ${form.level === value
                                        ? 'border-primary-500 bg-primary-500/15'
                                        : 'border-surface-700 hover:border-surface-600 bg-surface-800/50'
                                    }`}
                            >
                                <div className={`font-semibold text-sm ${form.level === value ? color : 'text-slate-300'}`}>{label}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Skills */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
                        <Code size={16} className="text-primary-400" /> Key Skills (optional, up to 10)
                    </label>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g. React, TypeScript..."
                            className="input-field flex-1"
                        />
                        <button type="button" onClick={addSkill} className="btn-secondary px-4 py-2">
                            <Plus size={18} />
                        </button>
                    </div>
                    {form.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {form.skills.map((s) => (
                                <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-300 text-sm">
                                    {s}
                                    <button onClick={() => removeSkill(s)} className="hover:text-red-400 transition-colors"><X size={13} /></button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="bg-surface-700/30 rounded-xl p-4 flex gap-3">
                    <div className="text-primary-400 mt-0.5">ℹ️</div>
                    <div className="text-sm text-slate-400">
                        AI will generate <strong className="text-slate-200">5 role-specific questions</strong> with increasing difficulty.
                        Your voice answers will be captured and evaluated in real-time.
                    </div>
                </div>

                <button onClick={handleStart} disabled={loading || !form.role} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base">
                    {loading ? (
                        <><Loader2 size={20} className="animate-spin" /> Generating Questions...</>
                    ) : (
                        <><Mic size={20} /> Start Interview <ChevronRight size={18} /></>
                    )}
                </button>
            </div>
        </div>
    );
};

export default InterviewSetupPage;

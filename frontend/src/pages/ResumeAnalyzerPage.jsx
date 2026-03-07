import { useState, useRef } from 'react';
import { resumeAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FileSearch, Upload, CheckCircle, XCircle, Lightbulb, Target, Loader2, FileText, RotateCcw } from 'lucide-react';

const ResumeAnalyzerPage = () => {
    const [file, setFile] = useState(null);
    const [jobDesc, setJobDesc] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef(null);

    const handleFile = (f) => {
        if (!f) return;
        if (f.type !== 'application/pdf') { toast.error('Only PDF files accepted'); return; }
        if (f.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }
        setFile(f);
        setResult(null);
    };

    const onDrop = (e) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files[0];
        handleFile(f);
    };

    const handleAnalyze = async () => {
        if (!file) { toast.error('Please upload a PDF resume'); return; }
        if (!jobDesc.trim()) { toast.error('Please paste the job description'); return; }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('resume', file);
            fd.append('jobDescription', jobDesc);
            fd.append('jobTitle', jobTitle);
            const { data } = await resumeAPI.analyzeResume(fd);
            setResult(data.resume);
            toast.success('ATS analysis complete!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => { setFile(null); setResult(null); setJobDesc(''); setJobTitle(''); };

    const scoreColor = (s) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';
    const scoreDeg = (s) => (s / 100) * 360;

    return (
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FileSearch size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-black text-white">ATS Resume Analyzer</h1>
                <p className="text-slate-400 mt-1">Upload your resume and compare it against any job description</p>
            </div>

            {!result ? (
                <div className="grid sm:grid-cols-2 gap-6">
                    {/* Left: Upload */}
                    <div className="space-y-4">
                        <div
                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragging ? 'border-primary-500 bg-primary-500/10' : file ? 'border-green-500/50 bg-green-500/5' : 'border-surface-700 hover:border-primary-500/50'
                                }`}
                            onClick={() => fileRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                        >
                            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                            {file ? (
                                <>
                                    <FileText size={40} className="mx-auto text-green-400 mb-3" />
                                    <p className="font-semibold text-green-400 text-sm">{file.name}</p>
                                    <p className="text-slate-500 text-xs mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="mt-3 text-xs text-red-400 hover:text-red-300">Remove</button>
                                </>
                            ) : (
                                <>
                                    <Upload size={36} className="mx-auto text-slate-500 mb-3" />
                                    <p className="text-sm font-medium text-slate-300">Drag & drop or click to upload</p>
                                    <p className="text-xs text-slate-500 mt-1">PDF only, max 10MB</p>
                                </>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Job Title (optional)</label>
                            <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                                placeholder="e.g. Senior React Developer" className="input-field" />
                        </div>
                    </div>

                    {/* Right: JD */}
                    <div className="flex flex-col gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Job Description *</label>
                            <textarea
                                value={jobDesc}
                                onChange={(e) => setJobDesc(e.target.value)}
                                placeholder="Paste the full job description here..."
                                className="input-field h-48 resize-none"
                            />
                        </div>
                        <button onClick={handleAnalyze} disabled={loading || !file || !jobDesc} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
                            {loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : <><FileSearch size={18} /> Analyze Resume</>}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* ATS Score */}
                    <div className="glass-card text-center py-10">
                        <div className="relative w-36 h-36 mx-auto mb-4">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
                                <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor(result.atsScore)} strokeWidth="10"
                                    strokeDasharray={`${(result.atsScore / 100) * 251.2} 251.2`}
                                    strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black" style={{ color: scoreColor(result.atsScore) }}>{result.atsScore}</span>
                                <span className="text-xs text-slate-500">ATS Score</span>
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-white">{result.jobTitle || 'Resume Analysis'}</h2>
                        <p className="text-slate-400 text-sm mt-1">{result.overallFeedback}</p>
                    </div>

                    {/* Skills grid */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="glass-card">
                            <h3 className="font-semibold text-green-400 flex items-center gap-2 mb-3"><CheckCircle size={16} /> Matched Skills ({result.matchedSkills?.length || 0})</h3>
                            <div className="flex flex-wrap gap-2">
                                {(result.matchedSkills || []).map((s) => (
                                    <span key={s} className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs">{s}</span>
                                ))}
                            </div>
                        </div>
                        <div className="glass-card">
                            <h3 className="font-semibold text-red-400 flex items-center gap-2 mb-3"><XCircle size={16} /> Missing Skills ({result.missingSkills?.length || 0})</h3>
                            <div className="flex flex-wrap gap-2">
                                {(result.missingSkills || []).map((s) => (
                                    <span key={s} className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Suggestions */}
                    <div className="glass-card">
                        <h3 className="font-semibold text-yellow-400 flex items-center gap-2 mb-4"><Lightbulb size={16} /> Improvement Suggestions</h3>
                        <ul className="space-y-2">
                            {(result.suggestions || []).map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                    <Target size={14} className="mt-0.5 text-yellow-400 flex-shrink-0" /> {s}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button onClick={reset} className="btn-secondary w-full flex items-center justify-center gap-2">
                        <RotateCcw size={16} /> Analyze Another Resume
                    </button>
                </div>
            )}
        </div>
    );
};

export default ResumeAnalyzerPage;

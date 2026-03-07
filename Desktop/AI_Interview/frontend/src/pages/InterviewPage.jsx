import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import FaceCamera from '../components/FaceCamera';
import toast from 'react-hot-toast';
import {
    MicOff, SkipForward, Volume2, Loader2,
    CheckCircle2, Clock, Send, Activity, Brain, MessageSquare, Zap
} from 'lucide-react';
import './InterviewDashboard.css';

/* ─── Web Speech API helpers ──────────────────────────────────────────────── */
const speak = (text, onEnd) => {
    if (!window.speechSynthesis) return onEnd?.();
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92;
    utter.pitch = 1;
    utter.lang = 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => v.lang === 'en-US' && v.name.includes('Google')) || voices[0];
    if (preferred) utter.voice = preferred;
    utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
};

const createRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.lang = 'en-US';
    r.continuous = true;
    r.interimResults = true;
    return r;
};
/* ─────────────────────────────────────────────────────────────────────────── */

const PHASES = { INTRO: 'intro', SPEAKING: 'speaking', LISTENING: 'listening', EVALUATING: 'evaluating', DONE: 'done' };
const AUTO_SUBMIT_SILENCE_MS = 5000;
const AUTO_SUBMIT_CHECK_MS = 500;

/* ── Animated Score Ring (SVG) ─────────────────────────────────────────── */
const ScoreRing = ({ score, size = 120, strokeWidth = 9, color = '#e87d3e', label }) => {
    const r = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, score || 0));
    const offset = circumference - (pct / 100) * circumference;
    const cx = size / 2;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <svg width={size} height={size} className="score-ring-svg">
                <circle cx={cx} cy={cx} r={r} className="score-ring-bg" strokeWidth={strokeWidth} />
                <circle
                    cx={cx} cy={cx} r={r}
                    className="score-ring-fill"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
                <text
                    x={cx} y={cx + 7}
                    textAnchor="middle"
                    fill="#f5f0e8"
                    fontSize={size > 100 ? '22' : '14'}
                    fontWeight="700"
                    className="score-ring-text"
                    style={{ transform: 'rotate(90deg)', transformBox: 'fill-box', transformOrigin: 'center' }}
                >
                    {score !== null && score !== undefined ? Math.round(score) : '—'}
                </text>
            </svg>
            {label && <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#7a7265', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>}
        </div>
    );
};

/* ── Sub-score bar component ─────────────────────────────────────────────── */
const SubScoreBar = ({ label, value, color, icon: Icon }) => {
    const pct = Math.max(0, Math.min(100, value || 0));
    return (
        <div className="sub-score-item">
            <div className="sub-score-label-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#a09880' }}>
                    {Icon && <Icon size={13} style={{ color }} />}
                    {label}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{value !== null && value !== undefined ? `${Math.round(value)}` : '—'}</span>
            </div>
            <div className="sub-score-bar-track">
                <div className="sub-score-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
};

/* ── Typewriter hook ──────────────────────────────────────────────────────── */
const useTypewriter = (text, speed = 22) => {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    useEffect(() => {
        setDisplayed('');
        setDone(false);
        if (!text) return;
        let idx = 0;
        const timer = setInterval(() => {
            idx++;
            setDisplayed(text.slice(0, idx));
            if (idx >= text.length) {
                clearInterval(timer);
                setDone(true);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text]);
    return { displayed, done };
};

/* ── Formatters ──────────────────────────────────────────────────────── */
const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const difficultyColor = (d) => d === 'easy' ? '#4ead7e' : d === 'medium' ? '#d4a130' : '#d95f52';

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const InterviewPage = () => {
    const navigate = useNavigate();
    const setup = JSON.parse(sessionStorage.getItem('interviewSetup') || 'null');

    const [questionIndex, setQuestionIndex] = useState(0);
    const [phase, setPhase] = useState(PHASES.INTRO);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [answers, setAnswers] = useState([]);
    const [scores, setScores] = useState([]);
    const [timer, setTimer] = useState(0);
    const [savingFinal, setSavingFinal] = useState(false);
    const [silenceCountdown, setSilenceCountdown] = useState(null);
    const [currentEval, setCurrentEval] = useState(null); // latest evaluation result

    const recognitionRef = useRef(null);
    const timerRef = useRef(null);
    const startMsRef = useRef(null);
    const lastSpeechRef = useRef(null);
    const silenceLoopRef = useRef(null);
    const transcriptRef = useRef('');

    const questions = setup?.questions || [];
    const currentQuestion = questions[questionIndex];

    // Typewriter for current question
    const { displayed: typewriterText, done: typewriterDone } = useTypewriter(
        phase !== PHASES.INTRO && phase !== PHASES.DONE ? currentQuestion?.question : ''
    );

    // Keep transcriptRef in sync
    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

    // Redirect if no setup
    useEffect(() => {
        if (!setup || !questions.length) {
            toast.error('No interview session found. Please set up first.');
            navigate('/interview/setup');
        }
    }, []);

    // ── Timer (counts up while listening) ────────────────────────────────────
    useEffect(() => {
        if (phase === PHASES.LISTENING) {
            timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [phase]);

    // ── Speak question when phase enters SPEAKING ─────────────────────────────
    useEffect(() => {
        if (phase === PHASES.SPEAKING && currentQuestion) {
            speak(`Question ${questionIndex + 1}: ${currentQuestion.question}`, () => {
                setPhase(PHASES.LISTENING);
                startListening();
            });
        }
    }, [phase, questionIndex]);

    // ── Start speaking on mount after brief intro ─────────────────────────────
    useEffect(() => {
        startMsRef.current = Date.now();
        const t = setTimeout(() => setPhase(PHASES.SPEAKING), 1500);
        return () => clearTimeout(t);
    }, []);

    // ── Silence auto-submit loop ──────────────────────────────────────────────
    const startSilenceDetection = useCallback(() => {
        clearInterval(silenceLoopRef.current);
        lastSpeechRef.current = Date.now();
        setSilenceCountdown(null);

        silenceLoopRef.current = setInterval(() => {
            const silentMs = Date.now() - lastSpeechRef.current;
            const hasAnswer = transcriptRef.current.trim().length > 0;

            if (hasAnswer && silentMs >= AUTO_SUBMIT_SILENCE_MS) {
                clearInterval(silenceLoopRef.current);
                setSilenceCountdown(null);
                window.dispatchEvent(new CustomEvent('interview:autosubmit'));
            } else if (hasAnswer && silentMs >= AUTO_SUBMIT_SILENCE_MS - 3000) {
                const secsLeft = Math.ceil((AUTO_SUBMIT_SILENCE_MS - silentMs) / 1000);
                setSilenceCountdown(Math.max(0, secsLeft));
            } else {
                setSilenceCountdown(null);
            }
        }, AUTO_SUBMIT_CHECK_MS);
    }, []);

    const stopSilenceDetection = useCallback(() => {
        clearInterval(silenceLoopRef.current);
        setSilenceCountdown(null);
    }, []);

    // ── Listen for auto-submit event ──────────────────────────────────────────
    useEffect(() => {
        const handler = () => {
            if (phase === PHASES.LISTENING) submitAnswer();
        };
        window.addEventListener('interview:autosubmit', handler);
        return () => window.removeEventListener('interview:autosubmit', handler);
    }, [phase, transcript]);

    // ── Speech Recognition ────────────────────────────────────────────────────
    const startListening = useCallback(() => {
        const r = createRecognition();
        if (!r) { toast.error('Speech recognition not supported. Use Chrome.'); return; }
        recognitionRef.current = r;
        setTranscript('');
        setInterimTranscript('');
        setTimer(0);
        lastSpeechRef.current = Date.now();

        r.onresult = (e) => {
            let final = '', interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i].isFinal) final += e.results[i][0].transcript;
                else interim += e.results[i][0].transcript;
            }
            if (final || interim) {
                lastSpeechRef.current = Date.now();
                setSilenceCountdown(null);
            }
            if (final) setTranscript((prev) => prev + final + ' ');
            setInterimTranscript(interim);
        };
        r.onerror = (e) => {
            if (e.error !== 'no-speech') toast.error(`Mic error: ${e.error}`);
        };
        r.onend = () => {
            if (recognitionRef.current === r) {
                try { r.start(); } catch { /* already stopped */ }
            }
        };
        r.start();
        startSilenceDetection();
    }, [startSilenceDetection]);

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
        }
        setInterimTranscript('');
        stopSilenceDetection();
    };

    // ── Submit answer ─────────────────────────────────────────────────────────
    const submitAnswer = async () => {
        stopListening();
        const finalAnswer = transcriptRef.current.trim() || transcript.trim();
        if (!finalAnswer) {
            toast.error('No answer recorded. Please speak your answer.');
            setPhase(PHASES.LISTENING);
            startListening();
            return;
        }

        setPhase(PHASES.EVALUATING);
        try {
            const { data } = await interviewAPI.evaluateAnswer({
                question: currentQuestion.question,
                expectedKeywords: currentQuestion.expectedKeywords,
                answer: finalAnswer,
            });
            const evaluation = data.evaluation;
            setCurrentEval(evaluation); // show live scores immediately
            const newAnswers = [...answers, { question: currentQuestion, answer: finalAnswer }];
            const newScores = [...scores, evaluation];
            setAnswers(newAnswers);
            setScores(newScores);

            if (questionIndex + 1 < questions.length) {
                setQuestionIndex(questionIndex + 1);
                setTranscript('');
                setCurrentEval(null);
                setPhase(PHASES.SPEAKING);
            } else {
                await finishInterview(newAnswers, newScores);
            }
        } catch (err) {
            toast.error('Evaluation failed. Please try again.');
            setPhase(PHASES.LISTENING);
            startListening();
        }
    };

    // ── Finish interview ──────────────────────────────────────────────────────
    const finishInterview = async (finalAnswers, finalScores) => {
        setPhase(PHASES.DONE);
        setSavingFinal(true);
        const durationMin = Math.round((Date.now() - startMsRef.current) / 60000);
        const overallScore = Math.round(
            finalScores.reduce((s, e) => s + (e.overall || 0), 0) / finalScores.length
        );
        const questionAnswers = finalAnswers.map((qa, i) => ({
            question: qa.question,
            answer: qa.answer,
            score: {
                ...finalScores[i]?.scores,
                overall: finalScores[i]?.overall || 0,
                missedTopics: finalScores[i]?.missedTopics || [],
                feedback: finalScores[i]?.feedback || '',
                improvementSuggestions: finalScores[i]?.improvementSuggestions || [],
            },
        }));

        try {
            const { data } = await interviewAPI.saveInterview({
                role: setup.role,
                experienceLevel: setup.level,
                skills: setup.skills,
                questionAnswers,
                overallScore,
                duration: durationMin,
            });
            sessionStorage.removeItem('interviewSetup');
            navigate(`/interview/results/${data.interview._id}`);
        } catch {
            toast.error('Failed to save interview. Redirecting anyway.');
            navigate('/dashboard');
        } finally {
            setSavingFinal(false);
        }
    };

    // ── Skip question ─────────────────────────────────────────────────────────
    const skipQuestion = () => {
        stopListening();
        const newAnswers = [...answers, { question: currentQuestion, answer: '[Skipped]' }];
        const newScores = [...scores, { overall: 0, scores: {}, feedback: 'Question skipped.' }];
        setAnswers(newAnswers);
        setScores(newScores);
        setCurrentEval(null);
        if (questionIndex + 1 < questions.length) {
            setQuestionIndex(questionIndex + 1);
            setTranscript('');
            setPhase(PHASES.SPEAKING);
        } else {
            finishInterview(newAnswers, newScores);
        }
    };

    if (!currentQuestion && phase !== PHASES.DONE) return null;

    const showCamera = phase !== PHASES.INTRO && phase !== PHASES.DONE;
    const progressPct = (questionIndex / questions.length) * 100;

    // Compute average score for history display
    const avgScore = scores.length
        ? Math.round(scores.reduce((s, e) => s + (e.overall || 0), 0) / scores.length)
        : null;

    // Sub-scores from latest eval
    const latestScores = currentEval?.scores || {};

    return (
        <div className="interview-root">
            {/* ── Camera PiP (floating) ───────────────────────────────── */}
            {showCamera && <FaceCamera />}

            {/* ── Done overlay ────────────────────────────────────────── */}
            {phase === PHASES.DONE && (
                <div className="done-overlay">
                    <div className="done-icon-ring">
                        <CheckCircle2 size={42} color="#4ead7e" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f5f0e8', marginBottom: '0.5rem' }}>
                            Interview Complete!
                        </h2>
                        <p style={{ color: '#7a7265', fontSize: '0.9rem' }}>
                            {savingFinal ? 'Saving your results…' : 'Redirecting...'}
                        </p>
                    </div>
                    {savingFinal && (
                        <Loader2 size={24} className="animate-spin" style={{ color: '#e87d3e' }} />
                    )}
                    {avgScore !== null && (
                        <ScoreRing score={avgScore} size={130} strokeWidth={10} color="#4ead7e" label="Session Avg" />
                    )}
                </div>
            )}

            {/* ── HEADER ──────────────────────────────────────────────── */}
            {phase !== PHASES.DONE && (
                <header className="interview-header" style={{ position: 'relative' }}>
                    {/* Left: branding */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'linear-gradient(135deg, #e87d3e, #3db89a)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Brain size={16} color="#fff" />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f5f0e8' }}>AI Interview</span>
                    </div>

                    {/* Center: question counter + phase */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#7a7265' }}>
                            Question{' '}
                            <span style={{ color: '#f5f0e8', fontWeight: 700 }}>
                                {Math.min(questionIndex + 1, questions.length)}
                            </span>
                            {' / '}{questions.length}
                        </span>

                        <span className={`phase-badge ${phase}`} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.3rem 0.8rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                            background: phase === PHASES.LISTENING ? 'rgba(217,95,82,0.1)'
                                : phase === PHASES.SPEAKING ? 'rgba(91,143,212,0.12)'
                                    : phase === PHASES.EVALUATING ? 'rgba(232,125,62,0.1)'
                                        : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${phase === PHASES.LISTENING ? 'rgba(217,95,82,0.3)'
                                : phase === PHASES.SPEAKING ? 'rgba(91,143,212,0.3)'
                                    : phase === PHASES.EVALUATING ? 'rgba(232,125,62,0.3)'
                                        : 'rgba(255,255,255,0.1)'}`,
                            color: phase === PHASES.LISTENING ? '#e87878'
                                : phase === PHASES.SPEAKING ? '#8ab4e8'
                                : phase === PHASES.EVALUATING ? '#e87d3e'
                                : '#a09880',
                        }}>
                            {phase === PHASES.LISTENING && <><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e87878', animation: 'livePulse 1.5s ease-in-out infinite' }} />Recording</>}
                            {phase === PHASES.SPEAKING && <><Volume2 size={12} />Reading</>}
                            {phase === PHASES.EVALUATING && <><Loader2 size={12} className="animate-spin" />Evaluating</>}
                            {phase === PHASES.INTRO && 'Preparing…'}
                        </span>
                    </div>

                    {/* Right: timer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7a7265', fontSize: '0.85rem' }}>
                        <Clock size={14} />
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: phase === PHASES.LISTENING ? '#e87878' : '#7a7265' }}>
                            {formatTime(timer)}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="interview-progress-track">
                        <div className="interview-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                </header>
            )}

            {/* ── MAIN BODY ────────────────────────────────────────────── */}
            {phase !== PHASES.DONE && (
                <main className="interview-body">

                    {/* ════════════════════════════════════════════════════
                        LEFT PANEL — SCORE DASHBOARD
                    ════════════════════════════════════════════════════ */}
                    <aside className="score-panel panel-enter">

                        {/* Header */}
                        <div className="score-panel-header">
                            <div className="score-panel-live-dot" />
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a7265' }}>
                                Live Review
                            </span>
                        </div>

                        {/* ── EVALUATING STATE — scanner ───────────────── */}
                        {phase === PHASES.EVALUATING && (
                            <div className="scanner-wrap panel-enter">
                                <div className="scanner-ring">
                                    <div className="scanner-sweep" />
                                </div>
                                <span style={{ fontSize: '0.82rem', color: '#e87d3e', fontWeight: 600 }}>
                                    AI is analyzing your answer…
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#5a5240', textAlign: 'center' }}>
                                    Checking relevance, clarity &amp; depth
                                </span>
                            </div>
                        )}

                        {/* ── SCORE DISPLAY (after evaluation) ─────────── */}
                        {phase !== PHASES.EVALUATING && scores.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="score-value-enter">

                                {/* Overall ring */}
                                <div className="overall-score-ring-wrap">
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#5a5240' }}>
                                        Last Score
                                    </span>
                                    <ScoreRing
                                        score={scores[scores.length - 1]?.overall}
                                        size={130}
                                        strokeWidth={10}
                                        color={
                                            (scores[scores.length - 1]?.overall || 0) >= 75 ? '#4ead7e'
                                            : (scores[scores.length - 1]?.overall || 0) >= 50 ? '#d4a130'
                                            : '#d95f52'
                                        }
                                        label="Overall"
                                    />
                                    {scores[scores.length - 1]?.feedback && (
                                        <p style={{ fontSize: '0.78rem', color: '#7a7265', textAlign: 'center', lineHeight: 1.5, marginTop: '0.25rem' }}>
                                            {scores[scores.length - 1].feedback}
                                        </p>
                                    )}
                                </div>

                                {/* Sub-scores */}
                                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1rem' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#5a5240', marginBottom: '0.85rem' }}>
                                        Breakdown
                                    </p>
                                    <div className="sub-score-list">
                                        <SubScoreBar label="Relevance" value={latestScores.relevance ?? scores[scores.length - 1]?.scores?.relevance} color="#e87d3e" icon={Zap} />
                                        <SubScoreBar label="Clarity" value={latestScores.clarity ?? scores[scores.length - 1]?.scores?.clarity} color="#5b8fd4" icon={MessageSquare} />
                                        <SubScoreBar label="Technical Depth" value={latestScores.technical ?? scores[scores.length - 1]?.scores?.technical} color="#3db89a" icon={Activity} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── EMPTY STATE (before first answer) ─────────── */}
                        {phase !== PHASES.EVALUATING && scores.length === 0 && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.5 }}>
                                <div style={{
                                    width: 60, height: 60, borderRadius: '50%',
                                    border: '2px dashed rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Activity size={24} color="#5a5240" />
                                </div>
                                <span style={{ fontSize: '0.8rem', color: '#5a5240', textAlign: 'center', lineHeight: 1.5 }}>
                                    Scores will appear<br />after your first answer
                                </span>
                            </div>
                        )}

                        {/* ── Score History ─────────────────────────────── */}
                        {scores.length > 1 && (
                            <div className="score-history-wrap">
                                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#5a5240' }}>
                                    History
                                </p>
                                {scores.slice(0, -1).map((s, i) => (
                                    <div key={i} className="score-history-item">
                                        <span style={{ fontSize: '0.78rem', color: '#7a7265' }}>Q{i + 1}</span>
                                        <span style={{
                                            fontSize: '0.82rem', fontWeight: 700,
                                            color: (s.overall || 0) >= 75 ? '#4ead7e' : (s.overall || 0) >= 50 ? '#d4a130' : '#d95f52'
                                        }}>
                                            {Math.round(s.overall || 0)}<span style={{ fontSize: '0.65rem', fontWeight: 400, color: '#5a5240' }}>/100</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Transcript Box ────────────────────────────── */}
                        <div className="transcript-box" style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a4438', marginBottom: '0.5rem' }}>
                                Your Answer
                            </p>
                            {phase === PHASES.LISTENING || phase === PHASES.EVALUATING ? (
                                <>
                                    <span>{transcript}</span>
                                    <span className="transcript-interim">{interimTranscript}</span>
                                    {phase === PHASES.LISTENING && <span className="transcript-cursor" />}
                                </>
                            ) : (
                                <span style={{ color: '#4a4438', fontStyle: 'italic' }}>
                                    {answers.length > 0 ? answers[answers.length - 1]?.answer : 'Waiting for your answer…'}
                                </span>
                            )}
                        </div>

                    </aside>

                    {/* ════════════════════════════════════════════════════
                        RIGHT PANEL — QUESTION DISPLAY
                    ════════════════════════════════════════════════════ */}
                    <section className="question-panel">
                        {/* Ambient blobs */}
                        <div className="question-panel-blob" />
                        <div className="question-panel-blob-2" />

                        <div className="question-panel-content">
                            {/* Question number badge */}
                            <div className="question-num-badge">
                                Q{questionIndex + 1}
                            </div>

                            {/* Topic + difficulty */}
                            {currentQuestion?.topic && (
                                <div className="topic-pill">
                                    {currentQuestion.topic}
                                    <span
                                        className="difficulty-dot"
                                        style={{ background: difficultyColor(currentQuestion.difficulty) }}
                                    />
                                    <span style={{ color: difficultyColor(currentQuestion.difficulty), textTransform: 'capitalize' }}>
                                        {currentQuestion.difficulty}
                                    </span>
                                </div>
                            )}

                            {/* Question text — typewriter */}
                            <div className="question-text-wrap">
                                <p className="question-text">
                                    {typewriterText}
                                    {!typewriterDone && <span className="question-text-cursor" />}
                                </p>
                            </div>

                            {/* Audio wave + recording status */}
                            {phase === PHASES.LISTENING && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div className="audio-wave-wrap">
                                        {[...Array(20)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`audio-wave-bar ${transcript || interimTranscript ? 'active' : ''}`}
                                                style={{
                                                    height: `${Math.random() > 0.5 ? 24 : 10}px`,
                                                    animationDelay: `${i * 0.05}s`,
                                                    opacity: transcript || interimTranscript ? 1 : 0.3,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Speaking state */}
                            {phase === PHASES.SPEAKING && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Volume2 size={16} style={{ color: '#5b8fd4', animation: 'livePulse 1.5s ease-in-out infinite' }} />
                                    <span style={{ fontSize: '0.82rem', color: '#5b8fd4' }}>Reading question aloud…</span>
                                </div>
                            )}

                            {/* Silence countdown banner */}
                            {silenceCountdown !== null && phase === PHASES.LISTENING && (
                                <div className="silence-banner">
                                    <Send size={13} />
                                    <span>
                                        Auto-submitting in <strong>{silenceCountdown}s</strong>…
                                        <button
                                            onClick={() => { lastSpeechRef.current = Date.now(); setSilenceCountdown(null); }}
                                            style={{ marginLeft: '0.75rem', fontSize: '0.75rem', color: '#a09880', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            Keep recording
                                        </button>
                                    </span>
                                </div>
                            )}

                            {/* Expected keywords (collapsible) */}
                            {(phase === PHASES.LISTENING || phase === PHASES.EVALUATING) && currentQuestion?.expectedKeywords?.length > 0 && (
                                <div className="keyword-section">
                                    <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#5a5240' }}>
                                        Key Concepts
                                    </p>
                                    <div className="keyword-pills">
                                        {currentQuestion.expectedKeywords.map((kw) => {
                                            const isMatched = transcript.toLowerCase().includes(kw.toLowerCase());
                                            return (
                                                <span key={kw} className={`keyword-pill ${isMatched ? 'matched' : ''}`}>
                                                    {isMatched && '✓ '}{kw}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            )}

            {/* ── CONTROL BAR ─────────────────────────────────────────── */}
            {phase !== PHASES.DONE && (
                <footer className="control-bar">
                    {/* Left: role/level info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#5a5240' }}>{setup?.role}</span>
                        {setup?.level && (
                            <span style={{
                                fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: 999,
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                color: '#5a5240', textTransform: 'capitalize'
                            }}>
                                {setup.level}
                            </span>
                        )}
                    </div>

                    {/* Center: action buttons */}
                    <div className="control-bar-center">
                        {phase === PHASES.LISTENING && (
                            <>
                                <button onClick={submitAnswer} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MicOff size={16} /> Submit Answer
                                </button>
                                <button onClick={skipQuestion} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <SkipForward size={15} /> Skip
                                </button>
                            </>
                        )}
                        {phase === PHASES.EVALUATING && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#7a7265' }}>
                                <Loader2 size={15} className="animate-spin" /> Analyzing response…
                            </span>
                        )}
                        {(phase === PHASES.SPEAKING || phase === PHASES.INTRO) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#7a7265' }}>
                                <Volume2 size={15} /> Listen carefully…
                            </span>
                        )}
                    </div>

                    {/* Right: session avg */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {avgScore !== null && (
                            <>
                                <span style={{ fontSize: '0.75rem', color: '#5a5240' }}>Avg</span>
                                <span style={{
                                    fontSize: '0.88rem', fontWeight: 700,
                                    color: avgScore >= 75 ? '#4ead7e' : avgScore >= 50 ? '#d4a130' : '#d95f52'
                                }}>
                                    {avgScore}<span style={{ fontSize: '0.65rem', color: '#5a5240' }}>/100</span>
                                </span>
                            </>
                        )}
                    </div>
                </footer>
            )}
        </div>
    );
};

export default InterviewPage;

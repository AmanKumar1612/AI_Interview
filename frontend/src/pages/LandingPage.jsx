import { Link } from 'react-router-dom';
import { Mic, Brain, FileSearch, BarChart3, Zap, Shield, ChevronRight, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
    { icon: Mic, title: 'Voice Interview', desc: 'Real-time speech-to-text sessions that feel like the real thing.', accent: 'var(--accent)' },
    { icon: Brain, title: 'AI Scoring', desc: 'LLM evaluation across accuracy, clarity, completeness & confidence.', accent: 'var(--red)' },
    { icon: FileSearch, title: 'ATS Resume Check', desc: 'Match your resume against any job description and close the gap.', accent: 'var(--teal)' },
    { icon: BarChart3, title: 'Progress Dashboard', desc: 'Track scores, spot weaknesses, and see yourself improve over time.', accent: 'var(--amber)' },
    { icon: Zap, title: 'Instant Feedback', desc: 'Missed concepts and improvement tips appear after every answer.', accent: '#9b7ee6' },
    { icon: Shield, title: 'Email Reports', desc: 'Full HTML performance reports delivered to your inbox after each session.', accent: 'var(--blue)' },
];

const steps = [
    { n: '1', title: 'Set your role', desc: 'Pick the job title, level, and skills you want to be grilled on.' },
    { n: '2', title: 'Do the interview', desc: 'AI reads questions aloud. You speak. The mic captures everything.' },
    { n: '3', title: 'Read the verdict', desc: 'Scores, gaps, and concrete tips — ready the moment you finish.' },
];

const LandingPage = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div>
            {/* ── HERO ───────────────────────────────────────────────── */}
            <section style={{ maxWidth: 740, margin: '0 auto', padding: '80px 24px 72px', textAlign: 'center' }}>

                <p className="section-label fade-up" style={{ marginBottom: '1.4rem' }}>
                    AI-Powered Interview Prep
                </p>

                <h1 className="fade-up-2" style={{
                    fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    marginBottom: '1.2rem',
                    color: 'var(--text-hi)',
                }}>
                    Practice interviews.<br />
                    <span className="gradient-text">Ace them for real.</span>
                </h1>

                <p className="fade-up-3" style={{
                    fontSize: '1.05rem',
                    color: 'var(--text-mid)',
                    maxWidth: 520,
                    margin: '0 auto 2.4rem',
                    lineHeight: 1.65,
                }}>
                    Voice interviews, AI scoring, ATS resume analysis and detailed reports — all in one place. No fluff.
                </p>

                <div className="fade-up-3" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {isAuthenticated ? (
                        <Link to="/interview/setup" className="btn-primary" style={{ fontSize: '0.95rem', padding: '0.75rem 1.8rem' }}>
                            Start Interview <ArrowRight size={16} />
                        </Link>
                    ) : (
                        <>
                            <Link to="/signup" className="btn-primary" style={{ fontSize: '0.95rem', padding: '0.75rem 1.8rem' }}>
                                Get started free <ArrowRight size={16} />
                            </Link>
                            <Link to="/login" className="btn-secondary" style={{ fontSize: '0.95rem', padding: '0.75rem 1.6rem' }}>
                                Sign in
                            </Link>
                        </>
                    )}
                </div>

                {/* Subtle stats strip */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '2.5rem',
                    marginTop: '3.5rem',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '2rem',
                    flexWrap: 'wrap',
                }}>
                    {[
                        { v: '5', l: 'questions per session' },
                        { v: '5', l: 'scoring dimensions' },
                        { v: '∞', l: 'practice sessions' },
                    ].map(({ v, l }) => (
                        <div key={l} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{v}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-lo)', marginTop: '0.3rem', letterSpacing: '0.04em' }}>{l}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ───────────────────────────────────────────── */}
            <section style={{ maxWidth: 1040, margin: '0 auto', padding: '0 24px 72px' }}>
                <div style={{ marginBottom: '2.5rem' }}>
                    <p className="section-label" style={{ marginBottom: '0.5rem' }}>What you get</p>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700 }}>
                        Everything in one tool
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                    {features.map(({ icon: Icon, title, desc, accent }) => (
                        <div key={title} style={{ background: 'var(--bg-card)', padding: '1.6rem', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                        >
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: `${accent}18`, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
                            }}>
                                <Icon size={18} style={{ color: accent }} />
                            </div>
                            <h3 style={{ fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem', color: 'var(--text-hi)' }}>{title}</h3>
                            <p style={{ fontSize: '0.83rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS ───────────────────────────────────────── */}
            <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 80px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    {steps.map(({ n, title, desc }) => (
                        <div key={n} className="card" style={{ position: 'relative' }}>
                            <div style={{
                                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em',
                                color: 'var(--accent)', marginBottom: '1rem', textTransform: 'uppercase',
                            }}>
                                Step {n}
                            </div>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{title}</h3>
                            <p style={{ fontSize: '0.83rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── BOTTOM CTA ─────────────────────────────────────────── */}
            <section style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 96px', textAlign: 'center' }}>
                <div className="card-accent" style={{ padding: '3rem 2rem' }}>
                    <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
                        Ready to start?
                    </h2>
                    <p style={{ color: 'var(--text-mid)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.65 }}>
                        Create a free account and run your first mock interview in under two minutes.
                    </p>
                    <Link
                        to={isAuthenticated ? '/interview/setup' : '/signup'}
                        className="btn-primary"
                        style={{ fontSize: '0.95rem', padding: '0.75rem 2rem' }}
                    >
                        {isAuthenticated ? 'Launch interview' : 'Create free account'}
                        <ChevronRight size={16} />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;

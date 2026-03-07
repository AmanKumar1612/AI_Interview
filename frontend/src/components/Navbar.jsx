import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Mic, Menu, X, LayoutDashboard, FileText, LogOut } from 'lucide-react';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };

    const navLinks = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, auth: true },
        { to: '/interview/setup', label: 'Interview', icon: Mic, auth: true },
        { to: '/resume', label: 'ATS Resume', icon: FileText, auth: true },
    ];

    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <nav style={{
            position: 'sticky', top: 0, zIndex: 50,
            background: 'rgba(17,17,16,0.88)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--border)',
        }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>

                    {/* Logo */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Mic size={14} color="#fff" />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-hi)', letterSpacing: '-0.01em' }}>
                            AI Interview
                        </span>
                    </Link>

                    {/* Desktop links */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden md:flex">
                        {navLinks.map(({ to, label, auth }) =>
                            auth && !isAuthenticated ? null : (
                                <Link key={to} to={to} style={{
                                    padding: '0.4rem 0.85rem',
                                    borderRadius: 8,
                                    fontSize: '0.85rem',
                                    fontWeight: isActive(to) ? 600 : 400,
                                    color: isActive(to) ? 'var(--accent)' : 'var(--text-mid)',
                                    background: isActive(to) ? 'var(--accent-soft)' : 'transparent',
                                    transition: 'color 0.18s, background 0.18s',
                                    textDecoration: 'none',
                                }}
                                    onMouseEnter={e => { if (!isActive(to)) e.currentTarget.style.color = 'var(--text-hi)'; }}
                                    onMouseLeave={e => { if (!isActive(to)) e.currentTarget.style.color = 'var(--text-mid)'; }}
                                >
                                    {label}
                                </Link>
                            )
                        )}
                    </div>

                    {/* Auth */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="hidden md:flex">
                        {isAuthenticated ? (
                            <>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '0.3rem 0.75rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: 999, fontSize: '0.82rem', color: 'var(--text-mid)',
                                }}>
                                    <div style={{
                                        width: 22, height: 22, borderRadius: '50%',
                                        background: 'var(--accent)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                                    }}>
                                        {user?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    {user?.name}
                                </div>
                                <button onClick={handleLogout} style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    fontSize: '0.82rem', color: 'var(--text-lo)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    transition: 'color 0.18s', padding: '0.3rem 0.5rem',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-lo)'}
                                >
                                    <LogOut size={14} /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--text-mid)', textDecoration: 'none', transition: 'color 0.18s' }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-hi)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-mid)'}
                                >
                                    Sign in
                                </Link>
                                <Link to="/signup" className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                    Get started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden"
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mid)', padding: 6 }}
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 20px 1rem', background: 'var(--bg)' }} className="md:hidden">
                    {navLinks.map(({ to, label, icon: Icon, auth }) =>
                        auth && !isAuthenticated ? null : (
                            <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '0.6rem 0.5rem', borderRadius: 8,
                                fontSize: '0.9rem', fontWeight: isActive(to) ? 600 : 400,
                                color: isActive(to) ? 'var(--accent)' : 'var(--text-mid)',
                                textDecoration: 'none',
                            }}>
                                <Icon size={16} /> {label}
                            </Link>
                        )
                    )}
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.75rem' }}>
                        {isAuthenticated ? (
                            <button onClick={handleLogout} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                fontSize: '0.88rem', color: 'var(--red)',
                                background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem',
                            }}>
                                <LogOut size={15} /> Logout
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '0.55rem' }}>Sign in</Link>
                                <Link to="/signup" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ flex: 1, textAlign: 'center', padding: '0.55rem' }}>Get started</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;

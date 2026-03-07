import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await authAPI.login(form);
            login(data.token, data.user);
            toast.success(`Welcome back, ${data.user.name}!`);
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div style={{ width: '100%', maxWidth: 400 }}>

                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.35rem' }}>Sign in</h1>
                    <p style={{ color: 'var(--text-mid)', fontSize: '0.88rem' }}>
                        Don't have an account?{' '}
                        <Link to="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                            Create one free
                        </Link>
                    </p>
                </div>

                {/* Form */}
                <div className="card">
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-mid)', marginBottom: '0.4rem' }}>
                                Email
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-lo)', pointerEvents: 'none' }} />
                                <input
                                    id="email" type="email" name="email"
                                    value={form.email} onChange={handleChange}
                                    placeholder="you@example.com"
                                    className="input-field"
                                    style={{ paddingLeft: 36 }}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-mid)', marginBottom: '0.4rem' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-lo)', pointerEvents: 'none' }} />
                                <input
                                    id="password" type={showPassword ? 'text' : 'password'} name="password"
                                    value={form.password} onChange={handleChange}
                                    placeholder="••••••••"
                                    className="input-field"
                                    style={{ paddingLeft: 36, paddingRight: 40 }}
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lo)',
                                    padding: 2, display: 'flex'
                                }}>
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '0.7rem' }}>
                            {loading
                                ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                : <><LogIn size={15} /> Sign in</>
                            }
                        </button>
                    </form>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default LoginPage;

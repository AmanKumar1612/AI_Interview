import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Mail, Lock, User, UserPlus, Eye, EyeOff } from 'lucide-react';

const SignupPage = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            const { data } = await authAPI.signup(form);
            login(data.token, data.user);
            toast.success(`Welcome, ${data.user.name}!`);
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sign up failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div style={{ width: '100%', maxWidth: 400 }}>

                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.35rem' }}>Create account</h1>
                    <p style={{ color: 'var(--text-mid)', fontSize: '0.88rem' }}>
                        Already have one?{' '}
                        <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
                    </p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {[
                            { id: 'name', label: 'Full name', type: 'text', placeholder: 'Aman Kumar', icon: User },
                            { id: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', icon: Mail },
                        ].map(({ id, label, type, placeholder, icon: Icon }) => (
                            <div key={id}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-mid)', marginBottom: '0.4rem' }}>{label}</label>
                                <div style={{ position: 'relative' }}>
                                    <Icon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-lo)', pointerEvents: 'none' }} />
                                    <input id={id} type={type} name={id} value={form[id]} onChange={handleChange}
                                        placeholder={placeholder} className="input-field" style={{ paddingLeft: 36 }} required />
                                </div>
                            </div>
                        ))}

                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-mid)', marginBottom: '0.4rem' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-lo)', pointerEvents: 'none' }} />
                                <input id="password" type={showPassword ? 'text' : 'password'} name="password"
                                    value={form.password} onChange={handleChange} placeholder="min 6 characters"
                                    className="input-field" style={{ paddingLeft: 36, paddingRight: 40 }} required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', padding: 2, display: 'flex',
                                }}>
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '0.7rem' }}>
                            {loading
                                ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                : <><UserPlus size={15} /> Create account</>
                            }
                        </button>
                    </form>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default SignupPage;

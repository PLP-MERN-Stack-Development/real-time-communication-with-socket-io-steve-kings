import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, MessageCircle } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [guestName, setGuestName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isAdminMode, setIsAdminMode] = useState(false);

    const { login, loginAsGuest } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email or username is required';
        } else if (formData.email.includes('@') && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email format is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        const result = await login(formData.email, formData.password);
        setLoading(false);

        if (result.success) {
            // Redirect based on user role
            if (result.user?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/chat');
            }
        } else {
            setErrors({ submit: result.error });
        }
    };

    const handleGuestLogin = (e) => {
        e.preventDefault();

        if (!guestName.trim()) {
            setErrors({ guest: 'Please enter a name' });
            return;
        }

        if (guestName.trim().length < 2) {
            setErrors({ guest: 'Name must be at least 2 characters' });
            return;
        }

        loginAsGuest(guestName.trim());
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <MessageCircle size={32} color={isAdminMode ? "#ff6600" : "#667eea"} />
                    </div>
                    <h1 className="auth-title">
                        {isAdminMode ? 'Admin Access' : 'Welcome Back'}
                    </h1>
                    <p className="auth-subtitle">
                        {isAdminMode ? 'Administrator Login Portal' : 'Sign in to Stephen\'s Chat'}
                    </p>
                    
                    {/* Admin Mode Toggle */}
                    <div style={{ marginTop: '16px' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsAdminMode(!isAdminMode);
                                if (!isAdminMode) {
                                    setFormData({ email: 'kings', password: 'kings123' });
                                } else {
                                    setFormData({ email: '', password: '' });
                                }
                            }}
                            style={{
                                background: isAdminMode ? 'var(--orange-primary)' : 'var(--bg-tertiary)',
                                color: isAdminMode ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                border: `1px solid ${isAdminMode ? 'var(--orange-primary)' : 'var(--border-primary)'}`,
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            🛡️ {isAdminMode ? 'Switch to User Login' : 'Admin Login'}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            <Mail size={16} style={{ marginRight: '8px', display: 'inline' }} />
                            Email or Username
                        </label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            placeholder="Enter your email or username"
                            disabled={loading}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            <Lock size={16} style={{ marginRight: '8px', display: 'inline' }} />
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`form-input ${errors.password ? 'error' : ''}`}
                            placeholder="Enter your password"
                            disabled={loading}
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    {errors.submit && (
                        <div className="error-message" style={{ textAlign: 'center' }}>
                            {errors.submit}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                        style={{
                            background: isAdminMode ? 'linear-gradient(135deg, var(--orange-primary) 0%, var(--orange-secondary) 100%)' : undefined
                        }}
                    >
                        {loading ? 'Signing In...' : (isAdminMode ? '🛡️ Admin Sign In' : 'Sign In')}
                    </button>
                </form>

                {!isAdminMode && (
                    <div className="guest-login">
                        <p style={{ textAlign: 'center', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
                            Or join as a guest
                        </p>
                        <form onSubmit={handleGuestLogin}>
                            <div className="form-group">
                                <input
                                    type="text"
                                    value={guestName}
                                    onChange={(e) => {
                                        setGuestName(e.target.value);
                                        if (errors.guest) {
                                            setErrors(prev => ({ ...prev, guest: '' }));
                                        }
                                    }}
                                    className={`form-input ${errors.guest ? 'error' : ''}`}
                                    placeholder="Enter your name"
                                    maxLength={20}
                                />
                                {errors.guest && <span className="error-message">{errors.guest}</span>}
                            </div>
                            <button type="submit" className="guest-button">
                                Join as Guest
                            </button>
                        </form>
                    </div>
                )}

                {isAdminMode && (
                    <div className="admin-hint">
                        <div style={{ 
                            background: 'var(--orange-dark)', 
                            border: '1px solid var(--orange-primary)', 
                            borderRadius: '12px', 
                            padding: '12px', 
                            marginTop: '16px',
                            fontSize: '13px',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: 'var(--orange-primary)', fontWeight: '600', marginBottom: '8px' }}>
                                🛡️ Administrator Portal
                            </div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Use your admin credentials to access the control panel
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Default: kings / kings123
                            </div>
                        </div>
                    </div>
                )}
                
                {!isAdminMode && (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <button 
                            type="button"
                            onClick={() => {
                                localStorage.clear();
                                window.location.reload();
                            }}
                            style={{
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-primary)',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Clear Data
                        </button>
                    </div>
                )}

                <div className="auth-link">
                    Don't have an account? <Link to="/register">Sign up here</Link>
                </div>
            </div>
            
            <div className="developed-badge">
                Developed 2025
            </div>
        </div>
    );
};

export default Login;
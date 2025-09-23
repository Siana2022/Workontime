import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Email y contraseña son obligatorios.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await login(email, password);

            if (result.success) {
                // Navigate to the root. App.js will handle the role-based redirect.
                navigate('/');
            } else {
                // Use a more generic error message for security
                setError('Email o contraseña incorrecto.');
                console.error("Login failed:", result.error); // Log the specific error for debugging
                setLoading(false);
            }
        } catch (err) {
            setError('Ocurrió un error al iniciar sesión. Inténtalo de nuevo.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <h2>Iniciar Sesión</h2>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="email"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Contraseña</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="current-password"
                    />
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? 'Accediendo...' : 'Acceder'}
                </button>
            </form>
        </div>
    );
};

export default Login;

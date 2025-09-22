import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !pin) {
            setError('Nombre y PIN son obligatorios.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const success = await login(name, pin);

            if (success) {
                // Navigate to the root. App.js will handle the role-based redirect.
                // The loading state will be implicitly reset by the component unmounting on navigation.
                navigate('/');
            } else {
                setError('Nombre o PIN incorrecto.');
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
                <img src="https://i.postimg.cc/D28NhLc6/WORKONTIME-20.png" alt="Work On Time Logo" className="login-logo" />
                <h2>Iniciar Sesión</h2>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="name">Nombre</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="pin">PIN</label>
                    <input
                        type="password"
                        id="pin"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        required
                        disabled={loading}
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

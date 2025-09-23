import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

export const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('fichaje-user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setSession(userData); // The user object itself will act as the session.
                setCompanyId(userData.company_id);
                setSettings(userData.companies || {});
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('fichaje-user'); // Clear corrupted data
        } finally {
            setLoading(false);
        }
    }, []); // Run only once on mount

    const login = async (fullName, pin) => {
        try {
            const { data: userData, error } = await supabase
                .from('employees')
                .select('*, companies(*)')
                .eq('full_name', fullName)
                .eq('pin', pin)
                .single();

            if (error) {
                console.error('Error logging in:', error.message);
                return { success: false, error: 'Nombre o PIN incorrecto.' };
            }

            if (userData) {
                localStorage.setItem('fichaje-user', JSON.stringify(userData));
                setUser(userData);
                setSession(userData); // The user object itself will act as the session.
                setCompanyId(userData.company_id);
                setSettings(userData.companies || {});
                return { success: true, user: userData };
            }

            return { success: false, error: 'Nombre o PIN incorrecto.' };

        } catch (error) {
            console.error('An unexpected error occurred during login:', error.message);
            return { success: false, error: 'Ocurrió un error inesperado.' };
        }
    };

    const logout = () => {
        localStorage.removeItem('fichaje-user');
        setUser(null);
        setSession(null);
        setCompanyId(null);
        setSettings({});
    };

    const value = {
        session,
        user,
        companyId,
        settings,
        login,
        logout,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

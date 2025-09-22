import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

export const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // On initial load, check localStorage for a saved user session
        try {
            const savedUser = localStorage.getItem('workontime_user');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                // We need to fetch fresh company settings, but we can set the user immediately
                setUser(parsedUser);
                setCompanyId(parsedUser.company_id);
                if (parsedUser.companies) {
                    setSettings(parsedUser.companies);
                }
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('workontime_user');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (fullName, pin) => {
        setLoading(true);
        try {
            const { data: employee, error } = await supabase
                .from('employees')
                .select('*, companies(*)') // Fetch employee and their related company data
                .eq('full_name', fullName)
                .single();

            if (error || !employee) {
                console.error('Login failed: User not found or name does not match exactly.', error?.message);
                return false;
            }

            // Manual PIN check (as per the custom auth flow)
            if (employee.pin != pin) {
                console.error('Login failed: Invalid PIN for user -', fullName);
                return false;
            }

            // If credentials are correct, set user state and save to localStorage
            setUser(employee);
            setCompanyId(employee.company_id);
            setSettings(employee.companies || {});
            localStorage.setItem('workontime_user', JSON.stringify(employee));

            return true;

        } catch (error) {
            console.error('An unexpected error occurred during login:', error.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setCompanyId(null);
        setSettings({});
        localStorage.removeItem('workontime_user');
    };

    const value = {
        // No longer providing Supabase 'session'
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

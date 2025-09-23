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
        const fetchSessionAndUserData = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    throw error;
                }
                setSession(data.session);
                if (data.session?.user) {
                    await fetchUserData(data.session.user);
                }
            } catch (error) {
                console.error("Error in initial session fetch: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSessionAndUserData();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(null); // Reset user profile on auth change
                if (session?.user) {
                    await fetchUserData(session.user);
                } else {
                    // Clear profile data on logout
                    setCompanyId(null);
                    setSettings({});
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchUserData = async (authUser) => {
        console.log("Fetching user data for auth user:", authUser.id);
        try {
            console.log("Step 1: Fetching from 'employees' table with joined 'companies'.");
            const { data: employeeData, error } = await supabase
                .from('employees')
                .select('*, companies(*)')
                .eq('id', authUser.id)
                .single();

            if (error) {
                console.error("ERROR during 'employees' or 'companies' fetch:", error);
                throw error;
            }
            console.log("Successfully fetched employee and company data:", employeeData);

            if (employeeData) {
                setUser(employeeData);
                setCompanyId(employeeData.company_id);
                setSettings(employeeData.companies || {});
                console.log("User profile and settings have been set in context.");
            } else {
                console.error("CRITICAL: No employee profile found for authenticated user:", authUser.id, ". Forcing logout.");
                await supabase.auth.signOut();
            }
        } catch (error) {
            console.error('Error in fetchUserData catch block:', error.message);
            setUser(null);
            setCompanyId(null);
            setSettings({});
        }
    };

    const login = async (email, password) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error('Supabase sign-in error:', error.message);
                return { success: false, error: error.message };
            }

            // onAuthStateChange will handle fetching the user data
            return { success: true };

        } catch (error) {
            console.error('An unexpected error occurred during login:', error.message);
            return { success: false, error: 'An unexpected error occurred.' };
        }
    };

    const value = {
        session,
        user,
        companyId,
        settings,
        login,
        logout: () => supabase.auth.signOut(),
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

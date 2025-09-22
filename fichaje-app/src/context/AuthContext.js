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
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                if (session?.user) {
                    await fetchUserData(session.user);
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
                if (session?.user) {
                    await fetchUserData(session.user);
                } else {
                    setUser(null);
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
        try {
            const { data: employeeData, error: employeeError } = await supabase
                .from('employees')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (employeeError) throw employeeError;

            if (employeeData) {
                setUser(employeeData);
                setCompanyId(employeeData.company_id);

                if (employeeData.company_id) {
                    const { data: companyData, error: companyError } = await supabase
                        .from('companies')
                        .select('*')
                        .eq('id', employeeData.company_id)
                        .single();

                    if (companyError) throw companyError;
                    setSettings(companyData || {});
                } else {
                    setSettings({});
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error.message);
            setUser(null);
            setCompanyId(null);
            setSettings({});
            // This will be caught by the top-level session fetcher's finally block
        }
    };

    const login = async (fullName, pin) => {
        try {
            const { data: employee, error: findError } = await supabase
                .from('employees')
                .select('email, pin')
                .eq('full_name', fullName)
                .single();

            if (findError || !employee) {
                console.error('Login failed: User not found or name does not match exactly.', findError?.message);
                return false;
            }

            if (employee.pin != pin) {
                console.error('Login failed: Invalid PIN for user -', fullName);
                return false;
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: employee.email,
                password: pin,
            });

            if (signInError) {
                console.error('Supabase sign-in error:', signInError.message);
                return false;
            }

            return true;

        } catch (error) {
            console.error('An unexpected error occurred during login:', error.message);
            return false;
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
            {!loading && children}
        </AuthContext.Provider>
    );
};

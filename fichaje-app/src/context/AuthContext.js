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
            const { data: employeeData, error } = await supabase
                .from('employees')
                .select('*, companies(*)')
                .eq('id', authUser.id)
                .single();

            if (error) throw error;

            if (employeeData) {
                setUser(employeeData);
                setCompanyId(employeeData.company_id);
                setSettings(employeeData.companies || {});
            }
        } catch (error) {
            console.error('Error fetching user data:', error.message);
            setUser(null);
            setCompanyId(null);
            setSettings({});
        }
    };

    const login = async (fullName, pin) => {
        try {
            // Step 1: Find the user by their exact full_name to get their email.
            const { data: employee, error: findError } = await supabase
                .from('employees')
                .select('email') // Only need the email to proceed.
                .eq('full_name', fullName)
                .single();

            if (findError || !employee || !employee.email) {
                console.error('Login failed: User not found or email is missing for name -', fullName, findError?.message);
                return false;
            }

            // Step 2: Attempt to sign in using the fetched email and the provided PIN.
            // Supabase handles the secure password/PIN check on the server.
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: employee.email,
                password: pin,
            });

            if (signInError) {
                // This is the only failure point we need to report to the user.
                // It will trigger for wrong PIN, non-existent email in auth.users, etc.
                console.error('Supabase sign-in error:', signInError.message);
                return false;
            }

            // If sign-in is successful, onAuthStateChange will handle fetching user data.
            return true;

        } catch (error) {
            // This will catch unexpected errors, like network issues.
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

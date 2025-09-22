import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

export const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null); // This will be the full employee record
    const [companyId, setCompanyId] = useState(null);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessionAndUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session?.user) {
                await fetchUserData(session.user);
            }
            setLoading(false);
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
            // Step 1: Fetch the core employee data
            const { data: employeeData, error: employeeError } = await supabase
                .from('employees')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (employeeError) throw employeeError;

            if (employeeData) {
                setUser(employeeData);
                setCompanyId(employeeData.company_id);

                // Step 2: Fetch the company data separately for settings
                if (employeeData.company_id) {
                    const { data: companyData, error: companyError } = await supabase
                        .from('companies')
                        .select('*')
                        .eq('id', employeeData.company_id)
                        .single();

                    if (companyError) {
                        console.error('Could not fetch company settings:', companyError);
                        setSettings({}); // Default to empty settings if company fetch fails
                    } else {
                        setSettings(companyData || {});
                    }
                } else {
                    setSettings({}); // No company associated
                }
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
            // Step 1: Find the user by their exact full_name (case-sensitive)
            const { data: employee, error: findError } = await supabase
                .from('employees')
                .select('email, pin')
                .eq('full_name', fullName)
                .single(); // Expect exactly one result

            if (findError || !employee) {
                console.error('Login failed: User not found or name does not match exactly.', findError?.message);
                return false;
            }

            // Step 2: Verify the PIN.
            if (employee.pin != pin) {
                console.error('Login failed: Invalid PIN for user -', fullName);
                return false;
            }

            // Step 3: If PIN is correct, sign in with the user's email.
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
        user, // The employee record
        companyId,
        settings,
        login,
        logout: () => supabase.auth.signOut(),
        loading, // Expose loading state
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

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
            console.error('Error fetching user data:', error);
            setUser(null);
            setCompanyId(null);
            setSettings({});
        }
    };

    const value = {
        session,
        user, // The employee record
        companyId,
        settings,
        signOut: () => supabase.auth.signOut(),
        loading, // Expose loading state
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UserPreferences {
    display_name?: string;
    email?: string;
}

export const useUserPreferences = () => {
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setLoading(false);
                    return;
                }

                // Set email
                if (user.email) {
                    setUserEmail(user.email);
                }

                // Try to get display name from preferences
                const { data: prefs } = await supabase
                    .from('user_preferences')
                    .select('display_name')
                    .eq('user_id', user.id)
                    .neq('created_at', new Date().toISOString()) // Cache buster
                    .single();

                if (prefs?.display_name) {
                    setUserName(prefs.display_name);
                } else if (user.email) {
                    // Fallback to email username
                    setUserName(user.email.split('@')[0]);
                }
            } catch (error) {
                console.error('Error fetching user preferences:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    return { userName, userEmail, loading };
};

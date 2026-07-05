import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useActivityLogs(limit: number = 10) {
    return useQuery({
        queryKey: ['activity_logs', limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching activity logs:', error);
                throw error;
            }

            return data || [];
        }
    });
}

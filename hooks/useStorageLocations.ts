import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { StorageLocation } from '../types';
import { toast } from 'sonner';

export const useStorageLocations = () => {
    return useQuery({
        queryKey: ['storage_locations'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('storage_locations')
                .select('*')
                .order('name');

            if (error) {
                toast.error('Error al cargar ubicaciones');
                throw error;
            }

            return data as StorageLocation[];
        },
    });
};

export const useCreateStorageLocation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (location: { name: string; phone?: string; address?: string; notes?: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            const { data, error } = await supabase
                .from('storage_locations')
                .insert({ ...location, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data as StorageLocation;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['storage_locations'] });
            toast.success('📍 Ubicación creada');
        },
        onError: (error: Error) => {
            toast.error('❌ Error: ' + error.message);
        },
    });
};

export const useDeleteStorageLocation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('storage_locations')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['storage_locations'] });
            toast.success('🗑️ Ubicación eliminada');
        },
        onError: (error: Error) => {
            toast.error('❌ Error: ' + error.message);
        },
    });
};

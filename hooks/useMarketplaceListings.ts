import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { MarketplaceListing } from '../types';

export function useMarketplaceListings() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['marketplace_listings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('marketplace_listings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as MarketplaceListing[];
        }
    });

    const addMutation = useMutation({
        mutationFn: async (newListing: Omit<MarketplaceListing, 'id' | 'user_id' | 'created_at'>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const { data, error } = await supabase
                .from('marketplace_listings')
                .insert([{ ...newListing, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketplace_listings'] });
        }
    });

    const addMultipleMutation = useMutation({
        mutationFn: async (newListings: Omit<MarketplaceListing, 'id' | 'user_id' | 'created_at'>[]) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const listingsWithUser = newListings.map(listing => ({ ...listing, user_id: user.id }));

            const { data, error } = await supabase
                .from('marketplace_listings')
                .insert(listingsWithUser)
                .select();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketplace_listings'] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<MarketplaceListing> }) => {
            const { data, error } = await supabase
                .from('marketplace_listings')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketplace_listings'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('marketplace_listings')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketplace_listings'] });
        }
    });

    return {
        ...query,
        addListing: addMutation.mutateAsync,
        addMultipleListings: addMultipleMutation.mutateAsync,
        updateListing: updateMutation.mutateAsync,
        deleteListing: deleteMutation.mutateAsync
    };
}

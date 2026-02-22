import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface AdjustmentType {
    id?: string;
    key: string;
    label: string;
    description?: string;
    affects_cost: boolean;
    is_built_in: boolean;
}

// Built-in adjustment types seeded on first load
const BUILT_IN_TYPES: Omit<AdjustmentType, 'id'>[] = [
    { key: 'CREDIT_CLAIM', label: 'Credit Claim', description: 'Crédito reclamado a la tienda por un problema', affects_cost: true, is_built_in: true },
    { key: 'REWARD_BACK', label: 'Reward Back', description: 'Recompensa o cashback de la plataforma', affects_cost: true, is_built_in: true },
    { key: 'PRICE_PROTECTION', label: 'Price Protection', description: 'Devolución por baja de precio', affects_cost: true, is_built_in: true },
    { key: 'COUPON', label: 'Cupón', description: 'Descuento por cupón aplicado en la compra', affects_cost: true, is_built_in: true },
    { key: 'PRICE_ADJUSTMENT', label: 'Ajuste de Precio', description: 'Ajuste manual al costo del producto', affects_cost: true, is_built_in: true },
];

export const useAdjustmentTypes = () => {
    const [types, setTypes] = useState<AdjustmentType[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTypes = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data, error } = await supabase
            .from('adjustment_types')
            .select('*')
            .eq('user_id', user.id)
            .order('is_built_in', { ascending: false });

        if (!error && data && data.length > 0) {
            setTypes(data);
        } else {
            // Seed built-in types if none exist
            const payload = BUILT_IN_TYPES.map(t => ({ ...t, user_id: user.id }));
            const { data: seeded } = await supabase
                .from('adjustment_types')
                .insert(payload)
                .select();
            if (seeded) setTypes(seeded);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    const addType = async (type: { label: string; description?: string; affects_cost: boolean }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const key = type.label.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
        const { error } = await supabase.from('adjustment_types').insert({
            user_id: user.id,
            key,
            label: type.label,
            description: type.description,
            affects_cost: type.affects_cost,
            is_built_in: false,
        });
        if (!error) fetchTypes();
        return !error;
    };

    const deleteType = async (id: string) => {
        const { error } = await supabase.from('adjustment_types').delete().eq('id', id);
        if (!error) fetchTypes();
        return !error;
    };

    return { types, loading, fetchTypes, addType, deleteType };
};

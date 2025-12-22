import { supabase } from '../lib/supabaseClient';

export const getPublicUrl = (path: string | null | undefined) => {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
};

import { supabase } from '../lib/supabaseClient';

export const getPublicUrl = (path: string | null | undefined) => {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
};

export const getThumbnailUrl = (path: string | null | undefined, width: number = 150, height: number = 150) => {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http')) return path;
    // Fallback to standard public URL if transformations are not supported by the plan
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
};

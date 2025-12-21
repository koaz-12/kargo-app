import { supabase } from '../lib/supabaseClient';

export const storageService = {
    /**
     * Upload a file to the 'products' bucket
     */
    async uploadImage(file: File, path: string) {
        const { data, error } = await supabase.storage
            .from('products')
            .upload(path, file);

        if (error) throw error;
        return data;
    },

    /**
     * Convert storage path to public URL
     */
    getPublicUrl(path: string) {
        const { data } = supabase.storage
            .from('products')
            .getPublicUrl(path);
        return data.publicUrl;
    },

    /**
     * Delete files by path
     */
    async deleteImages(paths: string[]) {
        if (!paths.length) return;
        const { error } = await supabase.storage
            .from('products')
            .remove(paths);

        if (error) throw error;
        return true;
    }
};

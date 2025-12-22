'use client';

import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Upload, X, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { getPublicUrl } from '@/utils/imageUrl';


interface ImageUploaderProps {
    images: string[];
    setImages: (images: string[]) => void;
    productId?: string; // If editing
}

export default function ImageUploader({ images, setImages, productId }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const files = Array.from(e.target.files);
        const newPaths: string[] = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${productId || 'temp'}/${fileName}`;

                // Upload to Supabase
                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Error uploading:', uploadError);
                    continue;
                }

                newPaths.push(filePath);
            }

            setImages([...images, ...newPaths]);
        } catch (error) {
            console.error('Error handling files:', error);
            alert('Error al subir imágenes');
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (path: string) => {
        if (!confirm('¿Eliminar imagen?')) return;

        // Remove from local state immediately
        const newImages = images.filter(img => img !== path);
        setImages(newImages);

        // If it's not a temp image (has productId), maybe delete from storage?
        // For simplicity, we just remove reference. Storage cleanup is a separate task.
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Galería de Fotos</label>
                <span className="text-[10px] text-slate-300">{images.length} fotos</span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                    <div key={`${img}-${idx}`} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <img
                            src={getPublicUrl(img)}
                            alt="Product"
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={() => handleDelete(img)}
                            className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                            <X size={12} />
                        </button>
                        {idx === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center p-0.5 font-bold backdrop-blur-sm">
                                Principal
                            </div>
                        )}
                    </div>
                ))}

                {/* Upload Button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                >
                    {uploading ? (
                        <Loader2 size={20} className="text-blue-500 animate-spin" />
                    ) : (
                        <>
                            <Upload size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            <span className="text-[9px] font-bold text-slate-400 group-hover:text-blue-500">Subir</span>
                        </>
                    )}
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
            />
        </div>
    );
}

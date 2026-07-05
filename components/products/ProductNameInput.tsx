import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, History } from 'lucide-react';
import { Product } from '../../types';
import { sanitizeSearchTerm } from '../../hooks/useProducts';
import { getPublicUrl } from '../../utils/imageUrl';

interface ProductNameInputProps {
    value: string;
    onChange: (val: string) => void;
    onSelectHistory: (product: Product) => void;
}

export default function ProductNameInput({ value, onChange, onSelectHistory }: ProductNameInputProps) {
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false); // Loading state
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch Auto-complete
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (value.length < 2) {
                setSuggestions([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const safe = sanitizeSearchTerm(value);
                const { data, error } = await supabase
                    .from('products')
                    .select('*, product_images(*)') // Include images for autocomplete
                    .or(`name.ilike.%${safe}%,sku.ilike.%${safe}%`)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) {
                    console.error("Error fetching history:", error);
                } else if (data) {
                    // Filter duplicates by SKU or Name to show distinct results
                    const unique: Product[] = [];
                    const seen = new Set();
                    for (const item of data) {
                        const key = item.sku ? item.sku : item.name.toLowerCase();
                        if (!seen.has(key)) {
                            seen.add(key);
                            unique.push(item as Product);
                            if (unique.length >= 5) break; // Only show up to 5 unique
                        }
                    }
                    setSuggestions(unique);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [value]);

    const handleSelect = (product: Product) => {
        onChange(product.name);
        onSelectHistory(product);
        setShowSuggestions(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full z-10">
            <div className="relative">
                {/* Search / Spinner Icon */}
                <div className="absolute left-3 top-3 text-slate-400">
                    {loading ? (
                        <div className="animate-spin h-3.5 w-3.5 border-2 border-slate-300 border-t-blue-500 rounded-full"></div>
                    ) : (
                        <Search size={14} />
                    )}
                </div>

                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Nombre del producto (ej. Reloj)"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:font-normal"
                />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && value.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-100 flex items-center gap-1.5">
                        <History size={10} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            {loading ? 'Buscando...' : 'Historial'}
                        </span>
                    </div>

                    {!loading && suggestions.length === 0 && (
                        <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
                            No encontrado en historial
                        </div>
                    )}

                    {suggestions.map((product: any) => (
                        <button
                            key={product.id}
                            onClick={() => handleSelect(product)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-none group"
                        >
                            <div className="w-10 h-10 shrink-0 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                                {product.image_url ? (
                                    <img src={getPublicUrl(product.image_url)} alt="" className="w-full h-full object-cover" />
                                ) : product.product_images && product.product_images.length > 0 ? (
                                    <img src={getPublicUrl(product.product_images[0].storage_path)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-slate-300 text-xs">📦</span>
                                )}
                            </div>
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-bold text-slate-700 text-xs group-hover:text-blue-700 truncate">{product.name}</span>
                                    {product.sku && (
                                        <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 shrink-0 border border-slate-200">
                                            {product.sku}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center text-[10px] text-slate-400">
                                    <span className="font-medium text-slate-500 mr-2">${product.buy_price}</span>
                                    <span>{product.created_at?.substring(0, 10)}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

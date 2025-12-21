import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, History } from 'lucide-react';
import { Product } from '../../types';

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
                const { data, error } = await supabase
                    .from('products')
                    .select('*') // Simplified query
                    .ilike('name', `%${value}%`)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (error) {
                    console.error("Error fetching history:", error);
                } else if (data) {
                    setSuggestions(data as Product[]);
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
        <div ref={wrapperRef} className="relative w-full z-50">
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

                    {suggestions.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => handleSelect(product)}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors flex flex-col border-b border-slate-50 last:border-none group"
                        >
                            <span className="font-bold text-slate-700 text-xs group-hover:text-blue-700">{product.name}</span>
                            <span className="text-[10px] text-slate-400">
                                ${product.buy_price} • {product.created_at?.substring(0, 10)}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

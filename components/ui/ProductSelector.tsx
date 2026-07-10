import { useState, useMemo, useRef, useEffect } from 'react';
import { Product } from '../../types';
import { Search, Package, ChevronDown, Check } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { getPublicUrl } from '../../utils/imageUrl';

interface ProductSelectorProps {
    value: string;
    onChange: (skuOrName: string) => void;
    disabled?: boolean;
}

export default function ProductSelector({ value, onChange, disabled }: ProductSelectorProps) {
    const { data: allProducts, isLoading } = useProducts();
    const [isOpen, setIsOpen] = useState(false);
    const [localValue, setLocalValue] = useState(value || '');
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync localValue with prop value
    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    // Group products by SKU (or name if no SKU)
    const groupedProducts = useMemo(() => {
        if (!allProducts) return [];
        
        // Only group products that are in stock (RECEIVED) or have a valid SKU to track
        const groups: Record<string, { product: Product, count: number }> = {};
        
        allProducts.forEach(p => {
            const key = p.sku || p.name;
            if (!groups[key]) {
                groups[key] = { product: p, count: 0 };
            }
            if (p.status === 'RECEIVED') {
                groups[key].count += 1;
            }
        });

        return Object.values(groups);
    }, [allProducts]);

    const filteredGroups = useMemo(() => {
        if (!localValue.trim()) return groupedProducts;
        const lowerSearch = localValue.toLowerCase();
        return groupedProducts.filter(({ product }) => 
            product.name.toLowerCase().includes(lowerSearch) || 
            (product.sku && product.sku.toLowerCase().includes(lowerSearch))
        );
    }, [groupedProducts, localValue]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // When clicking outside, we just keep whatever they typed
                if (localValue !== value) {
                    onChange(localValue);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [localValue, value, onChange]);

    const handleSelect = (key: string) => {
        setLocalValue(key);
        onChange(key);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
        onChange(e.target.value); // Report to parent immediately so it acts as free text
        setIsOpen(true);
    };

    // Find if current localValue exactly matches a product to show its thumbnail inside the input
    const exactMatchGroup = useMemo(() => {
        if (!localValue) return null;
        return groupedProducts.find(g => (g.product.sku || g.product.name) === localValue);
    }, [localValue, groupedProducts]);

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className={`relative flex items-center w-full bg-white border ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'} rounded-lg transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-slate-300'}`}>
                {exactMatchGroup ? (
                    <div className="absolute left-2.5 w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 pointer-events-none">
                        {exactMatchGroup.product.images && exactMatchGroup.product.images.length > 0 ? (
                            <img src={getPublicUrl(exactMatchGroup.product.images[0].storage_path)} alt="" className="w-full h-full object-cover" />
                        ) : exactMatchGroup.product.image_url ? (
                            <img src={getPublicUrl(exactMatchGroup.product.image_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Package size={12} className="text-slate-400" />
                        )}
                    </div>
                ) : (
                    <Search className="absolute left-3 text-slate-400 pointer-events-none" size={14} />
                )}
                
                <input
                    type="text"
                    value={localValue}
                    onChange={handleInputChange}
                    onFocus={() => !disabled && setIsOpen(true)}
                    disabled={disabled}
                    placeholder="Escribe un nombre o elige de la lista..."
                    className="w-full py-2.5 pl-10 pr-8 bg-transparent text-xs text-slate-700 font-medium outline-none"
                    autoComplete="off"
                />

                <button 
                    type="button"
                    onClick={() => {
                        if (!disabled) {
                            setIsOpen(!isOpen);
                            // Focus the input if opening
                            if (!isOpen) {
                                const input = containerRef.current?.querySelector('input');
                                input?.focus();
                            }
                        }
                    }}
                    className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                >
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-60 overflow-y-auto p-1">
                        {isLoading ? (
                            <p className="text-center text-xs text-slate-400 py-4">Cargando inventario...</p>
                        ) : (
                            <>
                                {filteredGroups.length === 0 ? (
                                    <div className="p-3 text-center">
                                        <p className="text-xs text-slate-500 font-medium mb-1">No hay productos que coincidan</p>
                                        <p className="text-[10px] text-slate-400">Se guardará como: <strong className="text-indigo-600">"{localValue}"</strong></p>
                                    </div>
                                ) : (
                                    filteredGroups.map(({ product, count }) => {
                                        const key = product.sku || product.name;
                                        const isSelected = value === key;
                                        const hasImage = (product.images && product.images.length > 0) || product.image_url;
                                        const imageSrc = product.images && product.images.length > 0 ? product.images[0].storage_path : product.image_url;

                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleSelect(key)}
                                                className={`w-full text-left p-2 rounded-lg flex items-center justify-between gap-3 transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                                                        {hasImage ? (
                                                            <img src={getPublicUrl(imageSrc)} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package size={14} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                            {product.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {product.sku && <span className="text-[10px] text-slate-400 font-mono">{product.sku}</span>}
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                {count} en Stock
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isSelected && <Check size={16} className="text-indigo-600 shrink-0" />}
                                            </button>
                                        );
                                    })
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

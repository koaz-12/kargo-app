import { useState, useMemo, useRef, useEffect } from 'react';
import { Product } from '../../types';
import { Search, Package, ChevronDown, Check, X } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { getPublicUrl } from '../../utils/imageUrl';

interface ProductSelectorProps {
    values: string[];
    onChange: (skusOrNames: string[]) => void;
    disabled?: boolean;
}

export default function ProductSelector({ values = [], onChange, disabled }: ProductSelectorProps) {
    const { data: allProducts, isLoading } = useProducts();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Group products by SKU (or name if no SKU)
    const groupedProducts = useMemo(() => {
        if (!allProducts) return [];
        
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
        if (!searchTerm.trim()) return groupedProducts;
        const lowerSearch = searchTerm.toLowerCase();
        return groupedProducts.filter(({ product }) => 
            product.name.toLowerCase().includes(lowerSearch) || 
            (product.sku && product.sku.toLowerCase().includes(lowerSearch))
        );
    }, [groupedProducts, searchTerm]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                if (searchTerm.trim() !== '') {
                    // Si dejó algo escrito y hace clic afuera, añadirlo si no está
                    const term = searchTerm.trim();
                    if (!values.includes(term)) {
                        onChange([...values, term]);
                    }
                    setSearchTerm('');
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchTerm, values, onChange]);

    const handleSelect = (key: string) => {
        if (values.includes(key)) {
            onChange(values.filter(v => v !== key));
        } else {
            onChange([...values, key]);
        }
        setSearchTerm('');
        // No cerramos el menú para que pueda elegir varios
        const input = containerRef.current?.querySelector('input');
        input?.focus();
    };

    const handleRemove = (e: React.MouseEvent, key: string) => {
        e.stopPropagation();
        onChange(values.filter(v => v !== key));
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div 
                className={`relative flex flex-wrap gap-1.5 items-center w-full bg-white border ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'} rounded-lg transition-all p-1.5 min-h-[44px] ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-slate-300'}`}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(true);
                        const input = containerRef.current?.querySelector('input');
                        input?.focus();
                    }
                }}
            >
                {/* Selected Pills */}
                {values.map(val => {
                    const group = groupedProducts.find(g => (g.product.sku || g.product.name) === val);
                    const label = group ? group.product.name : val;
                    const skuLabel = group?.product.sku ? ` (${group.product.sku})` : '';

                    return (
                        <span key={val} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-1 rounded-md text-[10px] font-bold max-w-[150px]">
                            <span className="truncate">{label}{skuLabel}</span>
                            <button 
                                type="button"
                                onClick={(e) => handleRemove(e, val)}
                                className="text-indigo-400 hover:text-indigo-800 focus:outline-none"
                            >
                                <X size={12} strokeWidth={3} />
                            </button>
                        </span>
                    );
                })}
                
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => !disabled && setIsOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchTerm.trim() !== '') {
                            e.preventDefault();
                            if (!values.includes(searchTerm.trim())) {
                                onChange([...values, searchTerm.trim()]);
                            }
                            setSearchTerm('');
                        } else if (e.key === 'Backspace' && searchTerm === '' && values.length > 0) {
                            onChange(values.slice(0, -1));
                        }
                    }}
                    disabled={disabled}
                    placeholder={values.length === 0 ? "Escribe o elige productos..." : ""}
                    className="flex-1 min-w-[120px] py-1 px-2 bg-transparent text-xs text-slate-700 font-medium outline-none"
                    autoComplete="off"
                />

                <button 
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!disabled) setIsOpen(!isOpen);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
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
                                {searchTerm.trim() !== '' && !filteredGroups.some(g => (g.product.sku || g.product.name) === searchTerm.trim()) && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(searchTerm.trim())}
                                        className="w-full text-left p-2 mb-1 rounded-lg flex items-center gap-3 transition-colors hover:bg-slate-50 border border-dashed border-slate-200"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                                            <Package size={14} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">
                                                Añadir "{searchTerm.trim()}"
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                Texto libre (sin vincular)
                                            </p>
                                        </div>
                                    </button>
                                )}

                                {filteredGroups.length === 0 ? (
                                    searchTerm.trim() === '' && <p className="text-center text-xs text-slate-400 py-4">No se encontraron productos</p>
                                ) : (
                                    filteredGroups.map(({ product, count }) => {
                                        const key = product.sku || product.name;
                                        const isSelected = values.includes(key);
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
                                                <div className="w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors">
                                                    {isSelected ? (
                                                        <div className="bg-indigo-600 w-full h-full rounded border-transparent flex items-center justify-center text-white">
                                                            <Check size={12} strokeWidth={3} />
                                                        </div>
                                                    ) : (
                                                        <div className="border-slate-300 w-full h-full rounded" />
                                                    )}
                                                </div>
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

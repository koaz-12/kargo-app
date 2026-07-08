import { useState, useMemo, useRef, useEffect } from 'react';
import { Product } from '../../types';
import { Search, Package, ChevronDown, Check } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';

interface ProductSelectorProps {
    value: string;
    onChange: (skuOrName: string) => void;
    disabled?: boolean;
}

export default function ProductSelector({ value, onChange, disabled }: ProductSelectorProps) {
    const { data: allProducts, isLoading } = useProducts();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

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
        if (!searchTerm.trim()) return groupedProducts;
        const lowerSearch = searchTerm.toLowerCase();
        return groupedProducts.filter(({ product }) => 
            product.name.toLowerCase().includes(lowerSearch) || 
            (product.sku && product.sku.toLowerCase().includes(lowerSearch))
        );
    }, [groupedProducts, searchTerm]);

    // Find the currently selected product group to display its name
    const selectedGroup = useMemo(() => {
        if (!value) return null;
        return groupedProducts.find(g => (g.product.sku || g.product.name) === value);
    }, [value, groupedProducts]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (key: string) => {
        onChange(key);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full bg-white border ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'} rounded-lg p-2.5 text-xs text-left flex items-center justify-between transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-slate-300'}`}
            >
                {selectedGroup ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                            {selectedGroup.product.image_urls && selectedGroup.product.image_urls.length > 0 ? (
                                <img src={selectedGroup.product.image_urls[0]} alt="" className="w-full h-full object-cover" />
                            ) : selectedGroup.product.image_url ? (
                                <img src={selectedGroup.product.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <Package size={12} className="text-slate-400" />
                            )}
                        </div>
                        <span className="font-bold text-slate-700 truncate">
                            {selectedGroup.product.name} {selectedGroup.product.sku && <span className="text-slate-400 font-normal">({selectedGroup.product.sku})</span>}
                        </span>
                    </div>
                ) : (
                    <span className="text-slate-400">
                        {value ? value : "Buscar producto en inventario..."}
                    </span>
                )}
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Escribe el nombre o SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1">
                        {isLoading ? (
                            <p className="text-center text-xs text-slate-400 py-4">Cargando inventario...</p>
                        ) : filteredGroups.length === 0 ? (
                            <p className="text-center text-xs text-slate-400 py-4">No se encontraron productos</p>
                        ) : (
                            filteredGroups.map(({ product, count }) => {
                                const key = product.sku || product.name;
                                const isSelected = value === key;
                                const hasImage = (product.image_urls && product.image_urls.length > 0) || product.image_url;
                                const imageSrc = product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : product.image_url;

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
                                                    <img src={imageSrc} alt="" className="w-full h-full object-cover" />
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
                    </div>
                </div>
            )}
        </div>
    );
}

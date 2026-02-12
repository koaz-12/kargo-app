import { Search, FileDown, Loader2, Filter, X } from 'lucide-react';
import { SortOption, StatusFilter } from '../types';
import { MultiSelect } from '../../../components/ui/MultiSelect';
import { useState } from 'react';

interface InventoryFilterBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    statusFilter: StatusFilter;
    setStatusFilter: (status: StatusFilter) => void;
    sortOption: SortOption;
    setSortOption: (sort: SortOption) => void;
    onExport: () => void;
    loading?: boolean;
    // New advanced filters
    selectedPlatforms?: string[];
    onPlatformsChange?: (platforms: string[]) => void;
    platformOptions?: { value: string; label: string }[];
    priceRange?: { min: number; max: number };
    onPriceRangeChange?: (range: { min: number; max: number }) => void;
}

export default function InventoryFilterBar({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortOption,
    setSortOption,
    onExport,
    loading,
    selectedPlatforms = [],
    onPlatformsChange,
    platformOptions = [],
    priceRange,
    onPriceRangeChange,
}: InventoryFilterBarProps) {
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const hasActiveFilters = selectedPlatforms.length > 0 ||
        (priceRange && (priceRange.min > 0 || priceRange.max < Infinity));

    const clearAllFilters = () => {
        if (onPlatformsChange) onPlatformsChange([]);
        if (onPriceRangeChange) onPriceRangeChange({ min: 0, max: Infinity });
        setStatusFilter('ALL');
        setSearchTerm('');
    };

    return (
        <div className="space-y-4 mb-4">
            {/* Status Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <FilterTab label="Todos" active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')} />
                <FilterTab label="Comprado" active={statusFilter === 'ORDERED'} onClick={() => setStatusFilter('ORDERED')} color="blue" />
                <FilterTab label="Recibido" active={statusFilter === 'RECEIVED'} onClick={() => setStatusFilter('RECEIVED')} color="emerald" />
                <FilterTab label="Vendido" active={statusFilter === 'SOLD'} onClick={() => setStatusFilter('SOLD')} color="slate" />
            </div>

            {/* Search & Sort */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    {loading ? (
                        <Loader2 className="absolute left-3 top-2.5 text-slate-400 animate-spin" size={18} />
                    ) : (
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    )}
                    <input
                        type="text"
                        placeholder="Buscar por nombre, SKU, tracking..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                >
                    <option value="DATE_DESC">Recientes</option>
                    <option value="DATE_ASC">Antiguos</option>
                    <option value="PRICE_DESC">Mayor Precio</option>
                    <option value="PRICE_ASC">Menor Precio</option>
                    <option value="NAME_ASC">Nombre (A-Z)</option>
                </select>
                <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`relative bg-white border border-slate-200 p-2 rounded-xl shadow-sm hover:bg-slate-50 transition-colors ${hasActiveFilters ? 'border-slate-900 bg-slate-900 text-white' : 'text-slate-600'}`}
                    title="Filtros avanzados"
                >
                    <Filter size={20} />
                    {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                    )}
                </button>
                <button
                    onClick={onExport}
                    className="bg-white border border-slate-200 text-slate-600 p-2 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
                    title="Exportar a CSV"
                >
                    <FileDown size={20} />
                </button>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-slate-800">Filtros Avanzados</h3>
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                                <X size={14} />
                                Limpiar todo
                            </button>
                        )}
                    </div>

                    {/* Platform Filter */}
                    {platformOptions.length > 0 && onPlatformsChange && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Plataformas
                            </label>
                            <MultiSelect
                                options={platformOptions}
                                selected={selectedPlatforms}
                                onChange={onPlatformsChange}
                                placeholder="Seleccionar plataformas..."
                            />
                        </div>
                    )}

                    {/* Price Range */}
                    {onPriceRangeChange && priceRange && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Rango de Precio (DOP)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Mín"
                                    value={priceRange.min || ''}
                                    onChange={(e) => onPriceRangeChange({ ...priceRange, min: parseFloat(e.target.value) || 0 })}
                                    className="w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                />
                                <input
                                    type="number"
                                    placeholder="Máx"
                                    value={priceRange.max === Infinity ? '' : priceRange.max}
                                    onChange={(e) => onPriceRangeChange({ ...priceRange, max: parseFloat(e.target.value) || Infinity })}
                                    className="w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function FilterTab({ label, active, onClick, color = 'slate' }: { label: string, active: boolean, onClick: () => void, color?: string }) {
    let activeClass = 'bg-slate-900 text-white';
    if (color === 'blue') activeClass = 'bg-blue-100 text-blue-700';
    if (color === 'emerald') activeClass = 'bg-emerald-100 text-emerald-700';
    if (color === 'gray') activeClass = 'bg-slate-200 text-slate-800';

    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${active ? activeClass : 'bg-slate-100 text-slate-500'}`}
        >
            {label}
        </button>
    );
}

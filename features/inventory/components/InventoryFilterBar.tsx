import { Search, FileDown, Loader2, Filter, X, ScanBarcode, ArrowUpDown } from 'lucide-react';
import { BarcodeScanner } from '../../../components/ui/BarcodeScanner';
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
    selectedAccounts?: string[]; // NEW
    onAccountsChange?: (accounts: string[]) => void; // NEW
    accountOptions?: { value: string; label: string }[]; // NEW
    priceRange?: { min: number; max: number };
    onPriceRangeChange?: (range: { min: number; max: number }) => void;
    // Selection props
    onSelectAll?: () => void;
    isAllSelected?: boolean;
    hasProducts?: boolean;
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
    selectedAccounts = [], // NEW
    onAccountsChange, // NEW
    accountOptions = [], // NEW
    priceRange,
    onPriceRangeChange,
    onSelectAll,
    isAllSelected,
    hasProducts,
}: InventoryFilterBarProps) {
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const hasActiveFilters = selectedPlatforms.length > 0 ||
        selectedAccounts.length > 0 ||
        (priceRange && (priceRange.min > 0 || priceRange.max < Infinity));

    const clearAllFilters = () => {
        if (onPlatformsChange) onPlatformsChange([]);
        if (onAccountsChange) onAccountsChange([]); // NEW
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
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 flex items-center">
                    {/* Fixed Icon Container */}
                    <div className={`absolute left-3 text-slate-400 pointer-events-none transition-opacity duration-200 ${loading ? 'opacity-100' : 'opacity-0'}`}>
                        <Loader2 className="animate-spin" size={18} />
                    </div>
                    <div className={`absolute left-3 text-slate-400 pointer-events-none transition-opacity duration-200 ${!loading ? 'opacity-100' : 'opacity-0'}`}>
                        <Search size={18} />
                    </div>

                    <input
                        key="inventory-search-input"
                        id="inventory-search-input"
                        type="search"
                        autoComplete="off"
                        spellCheck="false"
                        placeholder="Buscar por nombre, SKU, tracking..."
                        className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {/* Fixed Clear Container */}
                    <div className={`absolute right-3 transition-opacity duration-200 ${searchTerm ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="text-slate-400 hover:text-slate-600 focus:outline-none bg-slate-100 hover:bg-slate-200 rounded-full p-0.5 transition-colors"
                            title="Limpiar búsqueda"
                            tabIndex={searchTerm ? 0 : -1}
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 text-slate-600 overflow-x-auto pb-1 sm:pb-0">
                    <button
                        onClick={() => setShowScanner(true)}
                        className="w-11 h-11 shrink-0 flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors hover:text-blue-600"
                        title="Escanear código"
                    >
                        <ScanBarcode size={20} />
                    </button>
                    {showScanner && (
                        <BarcodeScanner
                            onScan={(code) => {
                                setSearchTerm(code);
                                setShowScanner(false);
                            }}
                            onClose={() => setShowScanner(false)}
                        />
                    )}

                    {/* Compact Sort Button */}
                    <div className="relative shrink-0 w-11 h-11">
                        <div className="w-full h-full flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors pointer-events-none">
                            <ArrowUpDown size={20} />
                        </div>
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            title="Ordenar por..."
                        >
                            <option value="DATE_DESC">Más Recientes</option>
                            <option value="DATE_ASC">Más Antiguos</option>
                            <option value="PRICE_DESC">Mayor Precio</option>
                            <option value="PRICE_ASC">Menor Precio</option>
                            <option value="NAME_ASC">Nombre (A-Z)</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`w-11 h-11 shrink-0 flex items-center justify-center relative bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors ${hasActiveFilters ? 'border-slate-900 bg-slate-900 text-white' : ''}`}
                        title="Filtros avanzados"
                    >
                        <Filter size={20} />
                        {hasActiveFilters && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        )}
                    </button>

                    <button
                        onClick={onExport}
                        className="w-11 h-11 shrink-0 flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
                        title="Exportar a CSV"
                    >
                        <FileDown size={20} />
                    </button>
                    {hasProducts && onSelectAll && (
                        <button
                            onClick={onSelectAll}
                            className={`w-11 h-11 shrink-0 flex items-center justify-center border rounded-xl shadow-sm transition-colors ${isAllSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-50'}`}
                            title={isAllSelected ? 'Desmarcar Todos' : 'Seleccionar Todo'}
                        >
                            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${isAllSelected ? 'border-none' : 'border-slate-400'}`}>
                                {isAllSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                        </button>
                    )}
                </div>
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

                    {/* Account Filter */}
                    {accountOptions.length > 0 && onAccountsChange && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Cuentas de Compra
                            </label>
                            <MultiSelect
                                options={accountOptions}
                                selected={selectedAccounts}
                                onChange={onAccountsChange}
                                placeholder="Seleccionar cuentas..."
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

import { Search, FileDown } from 'lucide-react';
import { SortOption, StatusFilter } from '../types';

interface InventoryFilterBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    statusFilter: StatusFilter;
    setStatusFilter: (status: StatusFilter) => void;
    sortOption: SortOption;
    setSortOption: (sort: SortOption) => void;
    onExport: () => void;
}

export default function InventoryFilterBar({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortOption,
    setSortOption,
    onExport
}: InventoryFilterBarProps) {
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
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, SKU..."
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
                    onClick={onExport}
                    className="bg-white border border-slate-200 text-slate-600 p-2 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
                    title="Exportar a CSV"
                >
                    <FileDown size={20} />
                </button>
            </div>
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

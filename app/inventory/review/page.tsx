'use client';
import { useRouter } from 'next/navigation';
import { useProducts } from '../../../hooks/useProducts';
import { useStorageLocations } from '../../../hooks/useStorageLocations';
import { ArrowLeft, MapPin, FileDown, CheckCircle2, Search, Package, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { getThumbnailUrl } from '../../../utils/imageUrl';
import { Pagination } from '../../../components/ui/Pagination';

export default function InventoryReviewPage() {
    const router = useRouter();
    const { data: products = [], isLoading: loading } = useProducts();
    const { data: storageLocations = [] } = useStorageLocations();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Derived stats for storage locations (only RECEIVED products)
    const receivedProducts = products.filter(p => p.status === 'RECEIVED');

    const groupItemsByNameAndSku = (items: any[]) => {
        const filtered = items.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const nameMap = new Map<string, any>();
        filtered.forEach(item => {
            const name = item.name.trim();
            const key = name.toLowerCase();
            if (!nameMap.has(key)) {
                nameMap.set(key, {
                    originalName: name,
                    image_url: item.image_url,
                    totalCount: 0,
                    skus: new Map<string, number>()
                });
            }
            
            const group = nameMap.get(key);
            group.totalCount += 1;
            const skuKey = item.sku ? item.sku.trim().toUpperCase() : 'Sin SKU';
            group.skus.set(skuKey, (group.skus.get(skuKey) || 0) + 1);
            if (!group.image_url && item.image_url) {
                group.image_url = item.image_url;
            }
        });

        return Array.from(nameMap.values()).map(g => ({
            name: g.originalName,
            image_url: g.image_url,
            totalCount: g.totalCount,
            skus: Array.from(g.skus.entries())
                .map(([sku, count]: any) => ({ sku, count }))
                .sort((a: any, b: any) => b.count - a.count)
        })).sort((a, b) => b.totalCount - a.totalCount);
    };

    
    // Group received products by storage location
    const storageStats = storageLocations.map(loc => {
        const items = receivedProducts.filter(p => p.storage_location_id === loc.id);
        const grouped = groupItemsByNameAndSku(items);
        const visibleCount = grouped.reduce((acc, g) => acc + g.totalCount, 0);
        return { ...loc, items, grouped, count: items.length, visibleCount };
    }).filter(loc => loc.visibleCount > 0);
    
    const unassignedItems = receivedProducts.filter(p => !p.storage_location_id);
    const unassignedGrouped = groupItemsByNameAndSku(unassignedItems);
    const unassignedVisibleCount = unassignedGrouped.reduce((acc, g) => acc + g.totalCount, 0);

    // Flatten logic for pagination
    const allFlatGroups: any[] = [];
    storageStats.forEach(loc => {
        loc.grouped.forEach((g: any) => {
            allFlatGroups.push({ location: loc, group: g, visibleCount: loc.visibleCount });
        });
    });
    if (unassignedVisibleCount > 0) {
        unassignedGrouped.forEach((g: any) => {
            allFlatGroups.push({ 
                location: { id: 'unassigned', name: 'Sin Asignar' }, 
                group: g, 
                visibleCount: unassignedVisibleCount 
            });
        });
    }

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const totalItems = allFlatGroups.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, products]);

    const paginatedFlatGroups = allFlatGroups.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Regroup the current page for rendering
    const renderedLocations = new Map();
    paginatedFlatGroups.forEach(({ location, group, visibleCount }) => {
        if (!renderedLocations.has(location.id)) {
            renderedLocations.set(location.id, {
                id: location.id,
                name: location.name,
                visibleCount: visibleCount,
                groups: []
            });
        }
        renderedLocations.get(location.id).groups.push(group);
    });
    const renderedLocationsArray = Array.from(renderedLocations.values());

    const handleQuickExport = () => {
        if (receivedProducts.length === 0) {
            toast.info("No hay artículos en estado RECIBIDO para exportar.");
            return;
        }

        const headers = ['Nombre', 'SKU', 'Ubicación', 'Costo Unit. (USD)', 'Venta Est. (DOP)', 'Fecha Recep.'];
        const csvRows = [headers.join(',')];

        receivedProducts.forEach(item => {
            const locationName = storageLocations.find(l => l.id === item.storage_location_id)?.name || 'Sin Asignar';
            const usdCost = item.buy_price + item.shipping_cost + (item.origin_tax || 0);
            
            const row = [
                `"${item.name.replace(/"/g, '""')}"`,
                item.sku || '',
                `"${locationName}"`,
                usdCost.toFixed(2),
                item.sale_price || 0,
                item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ''
            ];
            csvRows.push(row.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `revision_inventario_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const renderGroupedList = (groupedItems: any[], locationId: string) => {
        return (
            <div className="divide-y divide-slate-50">
                {groupedItems.map((group, idx) => {
                    const groupId = `${locationId}-${idx}`;
                    const isExpanded = expandedGroups[groupId] !== false; // expanded by default

                    return (
                        <div key={groupId} className="p-3 transition-colors bg-white hover:bg-slate-50/50">
                            {/* Header: Product Name & Total Count */}
                            <div 
                                className="flex items-start gap-3 cursor-pointer" 
                                onClick={() => toggleGroup(groupId)}
                            >
                                <div className="w-10 h-10 rounded border border-slate-200 bg-slate-100 shrink-0 overflow-hidden relative">
                                    {group.image_url ? (
                                        <img src={getThumbnailUrl(group.image_url)} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    ) : (
                                        <div className="w-full h-full flex justify-center items-center text-slate-400">
                                            <Package size={16} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-slate-800 line-clamp-2">{group.name}</h4>
                                    <div className="flex items-center gap-2 ml-2">
                                        <span className="text-sm font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md min-w-[2rem] text-center border border-slate-200">
                                            {group.totalCount}
                                        </span>
                                        {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                    </div>
                                </div>
                            </div>
                            
                            {/* SKUs List (Expanded state) */}
                            {isExpanded && (
                                <div className="mt-2 pl-[3.25rem]">
                                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 space-y-1.5">
                                        {group.skus.map((skuData: any, sIdx: number) => (
                                            <div key={sIdx} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="text-slate-400">↳</span>
                                                    {skuData.sku === 'Sin SKU' ? (
                                                        <span className="text-slate-500 italic truncate">Sin SKU</span>
                                                    ) : (
                                                        <span className="font-bold text-slate-600 truncate bg-white border border-slate-200 px-1 rounded uppercase tracking-wide">
                                                            {skuData.sku}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-bold text-slate-700 w-10 text-right shrink-0">{skuData.count} uni.</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 max-w-md mx-auto relative pb-24 shadow-2xl shadow-slate-200">
            {/* Header */}
            <div className="flex flex-col mb-6 gap-4">
                <div className="flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <CheckCircle2 size={24} className="text-blue-600" />
                        Revisión Física
                    </h1>
                    <button onClick={handleQuickExport} title="Exportar CSV" className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-sm border border-blue-100 hover:bg-blue-100 transition-colors">
                        <FileDown size={20} />
                    </button>
                </div>

                {/* Resumen General */}
                {!loading && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Recibidos</p>
                            <p className="text-3xl font-black text-slate-800 mt-0.5">{receivedProducts.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                            <Package size={24} />
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400">Cargando datos...</div>
            ) : (
                <div className="space-y-6">
                    {/* Búsqueda simple */}
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar en el conteo (Nombre o SKU)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow shadow-sm font-medium"
                        />
                    </div>

                    {/* Grupos por Ubicación */}
                    <div className="space-y-4">
                        <h2 className="font-bold text-slate-800 text-sm pl-1 uppercase tracking-wider text-[11px] text-slate-400">Desglose por Ubicación</h2>

                        {storageStats.length === 0 && unassignedVisibleCount === 0 && (
                            <p className="text-center text-sm text-slate-500 py-8 italic">No hay artículos para mostrar con esa búsqueda.</p>
                        )}

                        {renderedLocationsArray.map(loc => (
                            <div key={loc.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className={`px-4 py-3 border-b flex items-center justify-between ${loc.id === 'unassigned' ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className={loc.id === 'unassigned' ? 'text-amber-500' : 'text-indigo-500'} />
                                        <h3 className="font-black text-slate-800 uppercase text-xs tracking-wide">{loc.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${loc.id === 'unassigned' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                                            {loc.visibleCount} Artículos
                                        </span>
                                    </div>
                                </div>
                                {renderGroupedList(loc.groups, loc.id)}
                            </div>
                        ))}

                        {totalItems > ITEMS_PER_PAGE && (
                            <div className="pt-4">
                                <Pagination 
                                    currentPage={currentPage}
                                    onPageChange={setCurrentPage}
                                    totalItems={totalItems}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}

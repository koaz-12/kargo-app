'use client';

import { useState, useMemo } from 'react';
import { useMarketplaceListings } from '../../hooks/useMarketplaceListings';
import MarketplaceCard from '../../components/marketplace/MarketplaceCard';
import MarketplaceFormModal from '../../components/marketplace/MarketplaceFormModal';
import BatchImportModal from '../../components/marketplace/BatchImportModal';
import { MarketplaceListing } from '../../types';
import { Store, Plus, Loader2, ArrowLeft, Sparkles, Search, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

export default function MarketplacePage() {
    const { data: listings, isLoading, addListing, updateListing, deleteListing, addMultipleListings } = useMarketplaceListings();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<MarketplaceListing | undefined>();
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>('newest');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const handleOpenCreate = () => {
        setEditingListing(undefined);
        setIsDuplicating(false);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (listing: MarketplaceListing) => {
        setEditingListing(listing);
        setIsDuplicating(false);
        setIsModalOpen(true);
    };

    const handleDuplicate = (listing: MarketplaceListing) => {
        const targetGroupId = listing.group_id || listing.id;
        setEditingListing({ 
            ...listing, 
            group_id: targetGroupId,
            title: listing.title + ' (Copia)' 
        });
        setIsDuplicating(true);
        setIsModalOpen(true);
    };

    const handleSave = async (data: Omit<MarketplaceListing, 'id' | 'user_id' | 'created_at'>) => {
        if (editingListing && !isDuplicating) {
            await updateListing({ id: editingListing.id, updates: data });
        } else {
            await addListing(data);
        }
    };

    const handleSaveBatch = async (data: Omit<MarketplaceListing, 'id' | 'user_id' | 'created_at'>[]) => {
        await addMultipleListings(data);
    };

    const topTags = useMemo(() => {
        if (!listings) return [];
        const tagCounts: Record<string, number> = {};
        listings.forEach(l => {
            if (l.tags) {
                l.tags.forEach(tag => {
                    const t = tag.toLowerCase().replace(/^#/, '');
                    tagCounts[t] = (tagCounts[t] || 0) + 1;
                });
            }
        });
        return Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(entry => entry[0]);
    }, [listings]);

    const filteredAndSortedListings = useMemo(() => {
        if (!listings) return [];
        let filtered = listings.filter(l => {
            const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (l.tags && l.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
            const matchesTag = selectedTag ? l.tags && l.tags.some(t => t.toLowerCase().replace(/^#/, '') === selectedTag) : true;
            return matchesSearch && matchesTag;
        });

        filtered.sort((a, b) => {
            switch(sortBy) {
                case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'price_desc': return b.price - a.price;
                case 'price_asc': return a.price - b.price;
                default: return 0;
            }
        });

        return filtered;
    }, [listings, searchQuery, sortBy]);

    const groupedListings = useMemo(() => {
        const groups: Record<string, MarketplaceListing[]> = {};

        filteredAndSortedListings.forEach(listing => {
            const key = listing.group_id || listing.id;
            if (!groups[key]) groups[key] = [];
            groups[key].push(listing);
        });

        const result: MarketplaceListing[][] = [];
        const seenGroups = new Set<string>();

        filteredAndSortedListings.forEach(listing => {
            const key = listing.group_id || listing.id;
            if (!seenGroups.has(key)) {
                result.push(groups[key]);
                seenGroups.add(key);
            }
        });

        return result;
    }, [filteredAndSortedListings]);

    return (
        <main className="min-h-screen bg-slate-50/50 pb-28 max-w-md mx-auto relative">
            <header className="sticky top-0 z-20 pt-6 pb-4 pl-4 pr-16 bg-slate-50/80 backdrop-blur-xl mb-2 border-b border-slate-200/50 flex items-center gap-3">
                <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-200/50 text-slate-500 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-slate-800 leading-tight flex items-center gap-2">
                        <Store size={22} className="text-blue-600" />
                        Marketplace FB
                    </h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Plantillas de Publicación</p>
                </div>
            </header>

            <div className="p-4">
                <div className="flex gap-3 mb-6">
                    <button 
                        onClick={handleOpenCreate}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 px-2 rounded-2xl shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200/50 transition-all active:scale-95 text-xs sm:text-sm border border-blue-500/20"
                    >
                        <Plus size={16} strokeWidth={2.5} /> Crear Plantilla
                    </button>
                    <button 
                        onClick={() => setIsBatchModalOpen(true)}
                        className="flex-1 bg-white/80 backdrop-blur-sm text-indigo-700 border border-slate-200/60 font-bold py-3.5 px-2 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:bg-white transition-all active:scale-95 text-xs sm:text-sm"
                    >
                        <Sparkles size={16} strokeWidth={2.5} className="text-indigo-500" /> Importación Masiva
                    </button>
                </div>

                {/* Filters and Search */}
                {listings && listings.length > 0 && (
                    <div className="mb-4 animate-in slide-in-from-top-2">
                        <div className="flex gap-2 mb-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar por título o etiqueta..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                />
                            </div>
                            <div className="relative">
                                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="appearance-none bg-white border border-slate-200 rounded-xl py-2.5 pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-slate-600 font-medium"
                                >
                                    <option value="newest">Más recientes</option>
                                    <option value="oldest">Más antiguos</option>
                                    <option value="price_desc">Mayor precio</option>
                                    <option value="price_asc">Menor precio</option>
                                </select>
                            </div>
                        </div>

                        {/* Quick Tag Filters */}
                        {topTags.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                <button
                                    onClick={() => setSelectedTag(null)}
                                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedTag === null ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-300'}`}
                                >
                                    Todas
                                </button>
                                {topTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedTag === tag ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center p-12 text-slate-400">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                ) : groupedListings.length > 0 ? (
                    <div className="space-y-2">
                        {groupedListings.map(group => (
                            <MarketplaceCard 
                                key={group[0].id}
                                listings={group}
                                onEdit={handleOpenEdit}
                                onDelete={deleteListing}
                                onDuplicate={handleDuplicate}
                            />
                        ))}
                    </div>
                ) : listings && listings.length > 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <p className="font-medium text-slate-600">No hay resultados</p>
                        <p className="text-xs mt-1">Intenta buscar otra palabra clave o etiqueta.</p>
                    </div>
                ) : (
                    <div className="text-center bg-white p-8 rounded-xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Store size={32} />
                        </div>
                        <h3 className="font-bold text-slate-700 mb-1">No hay plantillas</h3>
                        <p className="text-xs text-slate-400">Crea tu primera plantilla para publicar rápido en Facebook Marketplace.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <MarketplaceFormModal 
                    initialData={isDuplicating ? { ...editingListing!, id: '' } : editingListing}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}

            {isBatchModalOpen && (
                <BatchImportModal 
                    onClose={() => setIsBatchModalOpen(false)}
                    onSave={handleSaveBatch}
                />
            )}
        </main>
    );
}

'use client';

import { useState } from 'react';
import { useMarketplaceListings } from '../../hooks/useMarketplaceListings';
import MarketplaceCard from '../../components/marketplace/MarketplaceCard';
import MarketplaceFormModal from '../../components/marketplace/MarketplaceFormModal';
import BatchImportModal from '../../components/marketplace/BatchImportModal';
import { MarketplaceListing } from '../../types';
import { Store, Plus, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function MarketplacePage() {
    const { data: listings, isLoading, addListing, updateListing, deleteListing } = useMarketplaceListings();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<MarketplaceListing | undefined>();
    const [isDuplicating, setIsDuplicating] = useState(false);

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
        setEditingListing({ ...listing, title: listing.title + ' (Copia)' });
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

    return (
        <main className="min-h-screen bg-slate-50/50 pb-28 max-w-md mx-auto relative">
            <header className="sticky top-0 z-20 pt-6 pb-4 px-4 bg-slate-50/80 backdrop-blur-xl mb-2 border-b border-slate-200/50 flex items-center gap-3">
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

                {isLoading ? (
                    <div className="flex justify-center p-12 text-slate-400">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                ) : listings && listings.length > 0 ? (
                    <div className="space-y-2">
                        {listings.map(listing => (
                            <MarketplaceCard 
                                key={listing.id}
                                listing={listing}
                                onEdit={handleOpenEdit}
                                onDelete={deleteListing}
                                onDuplicate={handleDuplicate}
                            />
                        ))}
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

import { useState } from 'react';
import { MarketplaceListing, Product } from '../../types';
import MarketplaceCard from './MarketplaceCard';
import { ChevronDown, Plus, Package, DollarSign } from 'lucide-react';
import SmartImage from '../ui/SmartImage';

interface MarketplaceGroupAccordionProps {
    sku: string | null;
    cards: MarketplaceListing[][];
    product?: Product;
    stockCount: number;
    isExpanded: boolean;
    onToggle: () => void;
    onQuickCreate: (sku: string) => void;
    onEdit: (listing: MarketplaceListing) => void;
    onDelete: (id: string) => void;
    onDuplicate: (listing: MarketplaceListing) => void;
}

export default function MarketplaceGroupAccordion({
    sku,
    cards,
    product,
    stockCount,
    isExpanded,
    onToggle,
    onQuickCreate,
    onEdit,
    onDelete,
    onDuplicate
}: MarketplaceGroupAccordionProps) {
    
    // Calculate metrics
    const totalVariants = cards.reduce((acc, card) => acc + card.length, 0);
    
    let avgPrice = 0;
    if (totalVariants > 0) {
        const sum = cards.reduce((acc, card) => acc + card.reduce((cAcc, v) => cAcc + v.price, 0), 0);
        avgPrice = sum / totalVariants;
    }

    const isUnlinked = sku === null;
    const title = isUnlinked ? "Otras Plantillas (Sin Vincular)" : (product?.name || sku);

    return (
        <div className="mb-4 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Accordion Header */}
            <div 
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-50 ${isExpanded ? 'bg-slate-50 border-b border-slate-100' : ''}`}
                onClick={onToggle}
            >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    {!isUnlinked && (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
                            {product ? (
                                <SmartImage 
                                    src={product.images && product.images.length > 0 ? product.images[0].storage_path : product.image_url} 
                                    className="w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Package size={16} />
                                </div>
                            )}
                        </div>
                    )}
                    <div className="min-w-0 pr-2">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{title}</h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {cards.length} {cards.length === 1 ? 'Tarjeta' : 'Tarjetas'} ({totalVariants} variantes)
                            </span>
                            {!isUnlinked && (
                                <>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${stockCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        <Package size={10} /> {stockCount} disp.
                                    </span>
                                    {avgPrice > 0 && (
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <DollarSign size={10} /> RD$ {Math.round(avgPrice).toLocaleString()} prom.
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {!isUnlinked && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onQuickCreate(sku);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="Crear nueva plantilla para este producto"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                        </button>
                    )}
                    <div className={`p-1.5 rounded-lg text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={18} />
                    </div>
                </div>
            </div>

            {/* Accordion Body */}
            {isExpanded && (
                <div className="p-3 bg-slate-50/50">
                    <div className="space-y-3">
                        {cards.map(group => (
                            <MarketplaceCard 
                                key={group[0].id}
                                listings={group}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onDuplicate={onDuplicate}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

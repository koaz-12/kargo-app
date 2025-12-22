'use client';

'use client';

import { useState } from 'react';
import { TrendingUp, Copy, Save, Loader2 } from 'lucide-react';
import { useProductForm } from '../../features/calculator/hooks/useProductForm';
import ProductHeader from '../../features/calculator/components/ProductHeader';
import SetupSection from '../../features/calculator/components/SetupSection';
import CostInputs from '../../features/calculator/components/CostInputs';
import AdjustmentsSection from '../../features/calculator/components/AdjustmentsSection';
import PricingCard from '../../features/calculator/components/PricingCard';
// import ActionToolbar from '../../features/calculator/components/ActionToolbar'; // REMOVED

interface ProductFormProps {
    editingId?: string | null;
}

export default function ProductForm({ editingId = null }: ProductFormProps) {
    const {
        formState,
        setters,
        results,
        platforms,
        accounts,
        saving,
        statusMsg,
        handleSave,
        handleAddToQueue
    } = useProductForm(editingId);

    const [showFullForm, setShowFullForm] = useState(false);
    const safeResults = results || { net_cost: 0, gross_profit: 0 };
    const hasPrice = formState.buyPrice > 0;
    const isEditing = !!editingId;

    return (
        <div className="pb-40 bg-slate-50 min-h-screen">
            {/* 1. Header (Sticky) */}
            <ProductHeader
                isEditing={!!editingId} // Fix boolean
                exchangeRate={formState.exchangeRate}
                onRateChange={setters.setExchangeRate}
            />

            <div className="px-4 space-y-3">
                {/* 2. Setup (Logic & Images) */}
                <SetupSection
                    formState={formState}
                    setters={setters}
                    platforms={platforms}
                    accounts={accounts}
                    editingId={editingId}
                />

                {/* 3. Costs (Purchase & Import) - Hidden by default if Editing */}
                {(!editingId || showFullForm) && (
                    <CostInputs
                        formState={formState}
                        setters={setters}
                        selectedPlatformName={platforms.find(p => p.id === formState.platformId)?.name}
                    />
                )}

                {/* 4. Toggle Button (Show Costs when Editing) */}
                {editingId && !showFullForm && (
                    <button
                        onClick={() => setShowFullForm(true)}
                        className="w-full py-2 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
                    >
                        <span>Ver Datos de Compra</span>
                        <TrendingUp size={14} />
                    </button>
                )}

                {/* 5. Adjustments (Always Visible) */}
                <AdjustmentsSection
                    formState={formState}
                    setters={setters}
                />

                {/* 6. Pricing (Sale Only - Hidden in New) */}
                <PricingCard
                    formState={formState}
                    setters={setters}
                    isVisible={!!editingId || showFullForm}
                />
            </div>

            {/* 6. Footer (Actions) - INLINED */}
            <div className="fixed bottom-16 left-0 right-0 z-[99999] pointer-events-none">
                {/* Wrapper allows click-through, inner container captures clicks */}
                <div className="max-w-md mx-auto bg-white border-t border-x border-slate-100 px-4 py-2 pointer-events-auto">
                    <div className="flex items-center justify-between">

                        {/* 1. Stats (Compact Left) */}
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Costo</span>
                                <span className="text-xs font-bold text-slate-700">RD${Math.round(safeResults.net_cost).toLocaleString()}</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Ganancia</span>
                                <span className={`text-xs font-bold ${safeResults.gross_profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    RD${Math.round(safeResults.gross_profit).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* 2. Actions (Icon Row) */}
                        <div className="flex items-center gap-2">
                            {/* Queue (Icon) */}
                            <button
                                onClick={handleAddToQueue}
                                disabled={!hasPrice}
                                className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all"
                                title="Agregar a cola"
                            >
                                <span className="text-xl leading-none mb-0.5">+</span>
                            </button>

                            {/* Clone (Icon Only) */}
                            {!isEditing && (
                                <button
                                    onClick={() => handleSave(true)}
                                    disabled={saving}
                                    className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center hover:bg-blue-100 active:scale-95 transition-all"
                                    title="Clonar"
                                >
                                    <Copy size={18} />
                                </button>
                            )}

                            {/* Save (Compact) */}
                            <button
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                className={`h-10 px-6 rounded-full font-bold text-sm shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center gap-2 
                                    ${saving ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                <span>Guardar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Toast (Simple) */}
            {statusMsg && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-5 z-[100000] flex items-center gap-2">
                    <span>✅</span>
                    <span>{statusMsg}</span>
                </div>
            )}
        </div>
    );
}

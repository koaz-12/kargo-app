'use client';

import { useState } from 'react';
import { TrendingUp, Copy, Save, Loader2 } from 'lucide-react';
import { useProductForm } from '../../features/calculator/hooks/useProductForm';
import ProductHeader from '../../features/calculator/components/ProductHeader';
import SetupSection from '../../features/calculator/components/SetupSection';
import CostInputs from '../../features/calculator/components/CostInputs';
import AdjustmentsSection from '../../features/calculator/components/AdjustmentsSection';
import PricingCard from '../../features/calculator/components/PricingCard';
import { ValidationErrors } from '../ui/ValidationErrors';
import BatchImportModal from '../../features/calculator/components/BatchImportModal';
import { Bot } from 'lucide-react';

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
        validationErrors,
        handleSave,
        handleAddToQueue,
        handleSaveAllQueue,
        queue,
        setQueue,
        courierDiscount
    } = useProductForm(editingId);

    const [showFullForm, setShowFullForm] = useState(false);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
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

            <div className="px-4 space-y-3 mt-4">
                {/* Validation Errors */}
                {Object.keys(validationErrors).length > 0 && (
                    <ValidationErrors errors={validationErrors} />
                )}

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
                        courierDiscount={courierDiscount}
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

            {/* 7. Footer (Actions) - Fixed Floating */}
            <div className="fixed left-0 right-0 z-[90] pointer-events-none px-2 sm:px-4" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 68px)' }}>
                {/* Wrapper allows click-through, inner container captures clicks */}
                <div className="max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 rounded-xl p-2 shadow-lg pointer-events-auto flex flex-wrap items-center justify-between gap-2">

                        {/* 1. Stats (Compact Left) */}
                        <div className="flex flex-col flex-shrink-0">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider w-12">Costo</span>
                            <span className="text-xs font-bold text-slate-700">RD${Math.round(safeResults.net_cost).toLocaleString()}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider w-12">Ganancia</span>
                            <span className={`text-xs font-black ${safeResults.gross_profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                RD${Math.round(safeResults.gross_profit).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* 2. Actions (Icon Row) */}
                    <div className="flex items-center gap-1.5 ml-auto">
                        {/* Queue (Icon or Counter) */}
                        <button
                            onClick={queue.length > 0 ? handleSaveAllQueue : handleAddToQueue}
                            disabled={!hasPrice && queue.length === 0}
                            className={`h-9 rounded-full flex items-center justify-center transition-all ${
                                queue.length > 0 
                                ? 'bg-indigo-600 text-white font-bold px-3 hover:bg-indigo-700 shadow-md' 
                                : 'w-9 bg-slate-50 text-slate-500 border border-slate-200/60 hover:bg-slate-100 hover:text-slate-700 hover:shadow-sm active:scale-95'
                            }`}
                            title={queue.length > 0 ? "Guardar Cola" : "Agregar a cola"}
                        >
                            {queue.length > 0 ? (
                                <span className="flex items-center gap-1 text-[11px] whitespace-nowrap">
                                    <span>🛒 {queue.length}</span>
                                    {saving && <Loader2 className="animate-spin" size={12} />}
                                </span>
                            ) : (
                                <span className="text-lg font-light leading-none mb-0.5">+</span>
                            )}
                        </button>

                        {/* Clone (Icon Only) */}
                        {!isEditing && (
                            <button
                                onClick={() => handleSave(true)}
                                disabled={saving || !hasPrice}
                                className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center hover:bg-blue-100 hover:shadow-sm active:scale-95 transition-all flex-shrink-0"
                                title="Clonar (a la cola)"
                            >
                                <Copy size={14} strokeWidth={2.5} />
                            </button>
                        )}

                        {/* Save (Compact) */}
                        <button
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className={`h-9 px-3.5 rounded-full font-bold text-sm active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0
                                ${saving ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:shadow-md'}`}
                        >
                            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} strokeWidth={2.5} />}
                            <span>Guardar</span>
                        </button>
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

            <BatchImportModal 
                isOpen={isBatchModalOpen}
                onClose={() => setIsBatchModalOpen(false)}
                onImport={(items) => {
                    const mappedItems = items.map(item => ({
                        ...formState,
                        ...item
                    }));
                    setQueue(prev => [...prev, ...mappedItems as any]);
                    toast.success(`Se agregaron ${items.length} productos a la cola`);
                }}
            />
        </div>
    );
}

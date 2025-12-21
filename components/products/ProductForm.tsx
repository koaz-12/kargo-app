'use client';

import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useProductForm } from '../../features/calculator/hooks/useProductForm';
import ProductHeader from '../../features/calculator/components/ProductHeader';
import SetupSection from '../../features/calculator/components/SetupSection';
import CostInputs from '../../features/calculator/components/CostInputs';
import AdjustmentsSection from '../../features/calculator/components/AdjustmentsSection';
import PricingCard from '../../features/calculator/components/PricingCard';
import ActionToolbar from '../../features/calculator/components/ActionToolbar';

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

    return (
        <div className="pb-24 bg-slate-50 min-h-screen">
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

            {/* 6. Footer (Actions) */}
            <ActionToolbar
                results={results}
                hasPrice={formState.buyPrice > 0}
                saving={saving}
                isEditing={!!editingId}
                onAddToQueue={handleAddToQueue}
                onSave={handleSave}
            />

            {/* Status Toast (Simple) */}
            {statusMsg && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2 z-[100]">
                    {statusMsg}
                </div>
            )}
        </div>
    );
}

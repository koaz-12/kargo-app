'use client';

import { useState } from 'react';
import { useAdjustmentTypes, AdjCategory } from '../../hooks/useAdjustmentTypes';
import { Tag, Plus, Trash2, Pencil, Check, X } from 'lucide-react';

export default function AdjustmentTypeSettings() {
    const { types: adjTypes, loading: adjTypesLoading, addType: addAdjType, editType: editAdjType, deleteType: deleteAdjType } = useAdjustmentTypes();
    const [newAdjLabel, setNewAdjLabel] = useState('');
    const [newAdjDesc, setNewAdjDesc] = useState('');
    const [newAdjCategory, setNewAdjCategory] = useState<AdjCategory>('CREDIT');
    const [editingAdjId, setEditingAdjId] = useState<string | null>(null);
    const [editAdjValues, setEditAdjValues] = useState<{ label: string; description: string; category: AdjCategory }>({ label: '', description: '', category: 'CREDIT' });

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden mb-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="p-4">
                <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <Tag size={16} className="text-slate-400" />
                    Tipos de Ajuste / Créditos
                </p>
                <p className="text-xs text-slate-400 mb-4">Gestiona los créditos y descuentos disponibles al registrar un producto.</p>

                {/* --- CREATE FORM --- */}
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 mb-4 space-y-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Nuevo Tipo</p>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setNewAdjCategory('CREDIT')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${newAdjCategory === 'CREDIT'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                                }`}
                        >
                            💳 Crédito
                        </button>
                        <button
                            onClick={() => setNewAdjCategory('DISCOUNT')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${newAdjCategory === 'DISCOUNT'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300'
                                }`}
                        >
                            🏷️ Descuento
                        </button>
                    </div>

                    <p className="text-[10px] text-slate-400 italic">
                        {newAdjCategory === 'CREDIT'
                            ? '💡 Crédito: el dinero queda en tu cuenta de la plataforma (debes volver a gastar allá).'
                            : '💡 Descuento: ya viene descontado del precio al momento de la compra.'}
                    </p>

                    <input
                        type="text"
                        placeholder="Nombre (ej. Store Wallet)"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newAdjLabel}
                        onChange={(e) => setNewAdjLabel(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Descripción (opcional)"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newAdjDesc}
                        onChange={(e) => setNewAdjDesc(e.target.value)}
                    />
                    <button
                        onClick={async () => {
                            if (!newAdjLabel.trim()) return;
                            const ok = await addAdjType({
                                label: newAdjLabel.trim(),
                                description: newAdjDesc.trim(),
                                affects_cost: newAdjCategory === 'DISCOUNT',
                                category: newAdjCategory,
                            });
                            if (ok) { setNewAdjLabel(''); setNewAdjDesc(''); setNewAdjCategory('CREDIT'); }
                        }}
                        className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-sm hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Agregar
                    </button>
                </div>

                {/* --- LIST --- */}
                <div className="space-y-2">
                    {adjTypesLoading && <p className="text-xs text-slate-300 italic">Cargando...</p>}

                    {['CREDIT', 'DISCOUNT'].map(cat => {
                        const group = adjTypes.filter(t => (t.category || 'CREDIT') === cat);
                        if (group.length === 0) return null;
                        return (
                            <div key={cat} className="mb-3">
                                <p className={`text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1 ${cat === 'CREDIT' ? 'text-blue-500' : 'text-emerald-500'}`}>
                                    {cat === 'CREDIT' ? '💳 Créditos (quedan en la plataforma)' : '🏷️ Descuentos (aplicados al comprar)'}
                                </p>
                                <div className="space-y-1.5">
                                    {group.map(t => (
                                        <div key={t.id} className={`rounded-xl border p-3 ${cat === 'CREDIT' ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                            {editingAdjId === t.id ? (
                                                <div className="space-y-2">
                                                    <div className="flex gap-1.5">
                                                        <button
                                                            onClick={() => setEditAdjValues(v => ({ ...v, category: 'CREDIT' }))}
                                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${editAdjValues.category === 'CREDIT'
                                                                ? 'bg-blue-600 text-white border-blue-600'
                                                                : 'bg-white text-slate-400 border-slate-200'
                                                                }`}
                                                        >💳 Crédito</button>
                                                        <button
                                                            onClick={() => setEditAdjValues(v => ({ ...v, category: 'DISCOUNT' }))}
                                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${editAdjValues.category === 'DISCOUNT'
                                                                ? 'bg-emerald-600 text-white border-emerald-600'
                                                                : 'bg-white text-slate-400 border-slate-200'
                                                                }`}
                                                        >🏷️ Descuento</button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={editAdjValues.label}
                                                        onChange={(e) => setEditAdjValues(v => ({ ...v, label: e.target.value }))}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                                        placeholder="Nombre"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editAdjValues.description}
                                                        onChange={(e) => setEditAdjValues(v => ({ ...v, description: e.target.value }))}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-400"
                                                        placeholder="Descripción (opcional)"
                                                    />
                                                    <div className="flex gap-2 pt-1">
                                                        <button
                                                            onClick={async () => {
                                                                if (t.id) {
                                                                    await editAdjType(t.id, {
                                                                        label: editAdjValues.label,
                                                                        description: editAdjValues.description,
                                                                        category: editAdjValues.category,
                                                                    });
                                                                }
                                                                setEditingAdjId(null);
                                                            }}
                                                            className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-700"
                                                        >
                                                            <Check size={12} /> Guardar
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingAdjId(null)}
                                                            className="flex-1 bg-slate-200 text-slate-600 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-300"
                                                        >
                                                            <X size={12} /> Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-bold text-slate-800 text-sm">{t.label}</span>
                                                            {t.is_built_in && (
                                                                <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">PREDEFINIDO</span>
                                                            )}
                                                        </div>
                                                        {t.description && <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>}
                                                        <p className="text-[9px] font-mono text-slate-300 mt-0.5">{t.key}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            onClick={() => {
                                                                setEditingAdjId(t.id || null);
                                                                setEditAdjValues({
                                                                    label: t.label,
                                                                    description: t.description || '',
                                                                    category: (t.category || 'CREDIT') as AdjCategory,
                                                                });
                                                            }}
                                                            className="text-slate-400 hover:text-blue-500 p-1"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={13} />
                                                        </button>
                                                        {!t.is_built_in && (
                                                            <button
                                                                onClick={() => t.id && deleteAdjType(t.id)}
                                                                className="text-slate-400 hover:text-red-500 p-1"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

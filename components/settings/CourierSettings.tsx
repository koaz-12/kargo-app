'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Truck, Plus, Trash2, Star, Edit2, Check, X } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';

export default function CourierSettings() {
    const [couriers, setCouriers] = useState<{ id: string, name: string, is_default: boolean, identification_pattern?: string }[]>([]);
    const [newCourier, setNewCourier] = useState('');
    const [newCourierPattern, setNewCourierPattern] = useState('');
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        fetchCouriers();
    }, []);

    const fetchCouriers = async () => {
        const { data } = await supabase.from('courier_presets').select('*').order('display_order');
        if (data) setCouriers(data);
    };

    const handleAddCourier = async () => {
        if (!newCourier.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('courier_presets').insert({
            user_id: user.id,
            name: newCourier.trim(),
            identification_pattern: newCourierPattern.trim() || null,
            is_default: couriers.length === 0
        });

        if (!error) {
            setNewCourier('');
            setNewCourierPattern('');
            fetchCouriers();
        }
    };

    const handleDeleteCourier = async () => {
        if (!itemToDelete) return;
        const { error } = await supabase.from('courier_presets').delete().eq('id', itemToDelete);
        if (!error) fetchCouriers();
        setItemToDelete(null);
    };

    const handleSetDefaultCourier = async (id: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('courier_presets').update({ is_default: false }).eq('user_id', user.id);
        const { error } = await supabase.from('courier_presets').update({ is_default: true }).eq('id', id);
        if (!error) fetchCouriers();
    };

    const handleStartEdit = (c: any) => {
        setEditingId(c.id);
        setEditValue(c.name);
    };

    const handleSaveEdit = async (id: string) => {
        if (!editValue.trim()) {
            setEditingId(null);
            return;
        }
        const { error } = await supabase.from('courier_presets').update({ name: editValue }).eq('id', id);
        if (!error) {
            setEditingId(null);
            fetchCouriers();
        }
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden mb-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 border-b border-slate-100/50">
                <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <Truck size={16} className="text-slate-400" />
                    Couriers
                </p>
                <p className="text-xs text-slate-400 mb-3">Gestiona tus couriers favoritos (Pintopack, Temu DO, etc).</p>

                <div className="space-y-2 mb-4">
                    <input
                        type="text"
                        placeholder="Nombre del courier (ej. Pintopack)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newCourier}
                        onChange={(e) => setNewCourier(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Patrón (ej. PP-, TEMU-DO-)"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newCourierPattern}
                            onChange={(e) => setNewCourierPattern(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCourier()}
                        />
                        <button
                            onClick={handleAddCourier}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 active:scale-95 transition-all font-bold text-sm"
                        >
                            <Plus size={18} className="inline mr-1" />
                            Agregar
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    {couriers.length === 0 && <p className="text-xs text-slate-300 italic">No hay couriers guardados.</p>}
                    {couriers.map(courier => (
                        <div key={courier.id} className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 transition-colors">
                            {editingId === courier.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="flex-1 bg-white dark:bg-slate-950 border border-indigo-300 dark:border-indigo-600 rounded px-2 py-1 text-sm font-bold text-indigo-700 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(courier.id)}
                                    />
                                    <button onClick={() => handleSaveEdit(courier.id)} className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors">
                                        <Check size={16} strokeWidth={3} />
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                                        <X size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-2 flex-1">
                                        <button
                                            onClick={() => handleSetDefaultCourier(courier.id)}
                                            className={`mt-0.5 p-1 rounded-full transition-colors ${courier.is_default ? 'text-amber-400 bg-amber-50 dark:bg-amber-400/10' : 'text-slate-300 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            title={courier.is_default ? "Courier por defecto" : "Hacer por defecto"}
                                        >
                                            <Star size={16} fill={courier.is_default ? "currentColor" : "none"} />
                                        </button>
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                                                {courier.name}
                                                {courier.is_default && <span className="text-[9px] bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider">Favorito</span>}
                                            </p>
                                            {courier.identification_pattern && (
                                                <p className="text-xs text-slate-400 font-mono mt-0.5">{courier.identification_pattern}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleStartEdit(courier)}
                                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setItemToDelete(courier.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {itemToDelete && (
                <ConfirmModal 
                    title="Eliminar Courier"
                    message="¿Estás seguro de que quieres borrar este courier?"
                    onConfirm={handleDeleteCourier}
                    onCancel={() => setItemToDelete(null)}
                />
            )}
        </div>
    );
}

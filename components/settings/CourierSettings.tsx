'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Truck, Plus, Trash2, Star } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';

export default function CourierSettings() {
    const [couriers, setCouriers] = useState<{ id: string, name: string, is_default: boolean, identification_pattern?: string }[]>([]);
    const [newCourier, setNewCourier] = useState('');
    const [newCourierPattern, setNewCourierPattern] = useState('');
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

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
                        <div key={courier.id} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-2 flex-1">
                                    <button
                                        onClick={() => handleSetDefaultCourier(courier.id)}
                                        className={`p-1 rounded transition-colors mt-0.5 ${courier.is_default
                                            ? 'text-yellow-500'
                                            : 'text-slate-300 hover:text-yellow-400'
                                            }`}
                                        title={courier.is_default ? 'Predeterminado' : 'Marcar como predeterminado'}
                                    >
                                        <Star size={16} className={courier.is_default ? 'fill-current' : ''} />
                                    </button>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-slate-700 text-sm">{courier.name}</span>
                                            {courier.is_default && (
                                                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold">
                                                    PREDETERMINADO
                                                </span>
                                            )}
                                        </div>
                                        {courier.identification_pattern && (
                                            <div className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded inline-block">
                                                {courier.identification_pattern}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setItemToDelete(courier.id)}
                                    className="text-slate-400 hover:text-red-500 ml-2 p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
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

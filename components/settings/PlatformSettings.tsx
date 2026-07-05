'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Globe, Plus, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Platform, PlatformType } from '../../types/index';

export default function PlatformSettings() {
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [newPlatformName, setNewPlatformName] = useState('');
    const [newPlatformType, setNewPlatformType] = useState<PlatformType>('TEMU');
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchPlatforms();
    }, []);

    const fetchPlatforms = async () => {
        const { data } = await supabase.from('platforms').select('*').order('created_at');
        if (data) setPlatforms(data);
    };

    const handleAddPlatform = async () => {
        if (!newPlatformName.trim()) return;
        const { error } = await supabase.from('platforms').insert({
            name: newPlatformName,
            type: newPlatformType,
            fee_structure_type: 'STANDARD'
        });
        if (!error) {
            setNewPlatformName('');
            fetchPlatforms();
        }
    };

    const handleDeletePlatform = async () => {
        if (!itemToDelete) return;
        const { error } = await supabase.from('platforms').delete().eq('id', itemToDelete);
        if (!error) fetchPlatforms();
        setItemToDelete(null);
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden mb-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 border-b border-slate-100/50">
                <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <Globe size={16} className="text-slate-400" />
                    Plataformas
                </p>
                <p className="text-xs text-slate-400 mb-3">Gestiona donde compras (Temu, Amazon, etc).</p>

                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="Nombre (ej. Mi Tienda)"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newPlatformName}
                        onChange={(e) => setNewPlatformName(e.target.value)}
                    />
                    <select
                        value={newPlatformType}
                        onChange={(e) => setNewPlatformType(e.target.value as PlatformType)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
                    >
                        <option value="TEMU">Temu</option>
                        <option value="AMAZON">Amazon</option>
                        <option value="ALIEXPRESS">AliExpress</option>
                        <option value="SHEIN">Shein</option>
                        <option value="OTHER">Otro</option>
                    </select>
                    <button
                        onClick={handleAddPlatform}
                        className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="space-y-2">
                    {platforms.length === 0 && <p className="text-xs text-slate-300 italic">No hay plataformas.</p>}
                    {platforms.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700 text-sm">{p.name}</span>
                                <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">{p.type}</span>
                            </div>
                            <button
                                onClick={() => setItemToDelete(p.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {itemToDelete && (
                <ConfirmModal 
                    title="Eliminar plataforma"
                    message="¿Estás seguro de que quieres borrar esta plataforma?"
                    onConfirm={handleDeletePlatform}
                    onCancel={() => setItemToDelete(null)}
                />
            )}
        </div>
    );
}

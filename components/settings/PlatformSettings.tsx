'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Globe, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Platform, PlatformType } from '../../types/index';

export default function PlatformSettings() {
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [newPlatformName, setNewPlatformName] = useState('');
    const [newPlatformType, setNewPlatformType] = useState<PlatformType>('TEMU');
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

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

    const handleStartEdit = (p: Platform) => {
        setEditingId(p.id);
        setEditValue(p.name);
    };

    const handleSaveEdit = async (id: string) => {
        if (!editValue.trim()) {
            setEditingId(null);
            return;
        }
        const { error } = await supabase.from('platforms').update({ name: editValue }).eq('id', id);
        if (!error) {
            setEditingId(null);
            fetchPlatforms();
        }
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
                        <option value="EBAY">Ebay</option>
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
                        <div key={p.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 transition-colors">
                            {editingId === p.id ? (
                                <div className="flex items-center gap-2 flex-1 mr-2">
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="flex-1 bg-white dark:bg-slate-950 border border-indigo-300 dark:border-indigo-600 rounded px-2 py-1 text-sm font-bold text-indigo-700 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(p.id)}
                                    />
                                    <button onClick={() => handleSaveEdit(p.id)} className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors">
                                        <Check size={16} strokeWidth={3} />
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                                        <X size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{p.name}</span>
                                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold">{p.type}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleStartEdit(p)}
                                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setItemToDelete(p.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </>
                            )}
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

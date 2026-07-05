'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';

export default function StorageLocationSettings() {
    const [storageLocations, setStorageLocations] = useState<{ id: string, name: string, phone?: string }[]>([]);
    const [newLocationName, setNewLocationName] = useState('');
    const [newLocationPhone, setNewLocationPhone] = useState('');
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchStorageLocations();
    }, []);

    const fetchStorageLocations = async () => {
        const { data } = await supabase.from('storage_locations').select('*').order('name');
        if (data) setStorageLocations(data);
    };

    const handleAddLocation = async () => {
        if (!newLocationName.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('storage_locations').insert({
            user_id: user.id,
            name: newLocationName.trim(),
            phone: newLocationPhone.trim() || null
        });
        if (!error) {
            setNewLocationName('');
            setNewLocationPhone('');
            fetchStorageLocations();
        }
    };

    const handleDeleteLocation = async () => {
        if (!itemToDelete) return;
        const { error } = await supabase.from('storage_locations').delete().eq('id', itemToDelete);
        if (!error) fetchStorageLocations();
        setItemToDelete(null);
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden mb-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 border-b border-slate-100/50">
                <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    Almacenes / Personas
                </p>
                <p className="text-xs text-slate-400 mb-3">Lugares o personas donde guardas artículos.</p>

                <div className="space-y-2 mb-4">
                    <input
                        type="text"
                        placeholder="Nombre (ej. Casa de María, Almacén Central)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Teléfono (opcional)"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newLocationPhone}
                            onChange={(e) => setNewLocationPhone(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                        />
                        <button
                            onClick={handleAddLocation}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 active:scale-95 transition-all font-bold text-sm"
                        >
                            <Plus size={18} className="inline mr-1" />
                            Agregar
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    {storageLocations.length === 0 && <p className="text-xs text-slate-300 italic">No hay ubicaciones guardadas.</p>}
                    {storageLocations.map(loc => (
                        <div key={loc.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-indigo-400" />
                                <div>
                                    <span className="font-bold text-slate-700 text-sm">{loc.name}</span>
                                    {loc.phone && <span className="text-[10px] text-slate-400 ml-2">📞 {loc.phone}</span>}
                                </div>
                            </div>
                            <button onClick={() => setItemToDelete(loc.id)} className="text-slate-400 hover:text-red-500">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {itemToDelete && (
                <ConfirmModal 
                    title="Eliminar Ubicación"
                    message="¿Estás seguro? Los productos asignados a esta ubicación quedarán sin ubicación (pero no se borrarán)."
                    onConfirm={handleDeleteLocation}
                    onCancel={() => setItemToDelete(null)}
                />
            )}
        </div>
    );
}

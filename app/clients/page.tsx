'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, UserPlus, Phone, Instagram, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Client } from '../../types';

export default function ClientsPage() {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', instagram: '', notes: '' });

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('name');
            
            if (error) throw error;
            setClients(data || []);
        } catch (error: any) {
            console.error('Error fetching clients:', error);
            toast.error('Error al cargar clientes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('clients')
                .insert([formData]);
            
            if (error) throw error;
            
            toast.success('Cliente registrado exitosamente');
            setIsModalOpen(false);
            setFormData({ name: '', phone: '', instagram: '', notes: '' });
            loadClients();
        } catch (error: any) {
            console.error('Error saving client:', error);
            toast.error('Ocurrió un error al guardar el cliente');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        (c.instagram && c.instagram.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 relative">
            <header className="sticky top-0 z-20 pt-6 pb-4 px-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center gap-3">
                <button
                    onClick={() => router.push('/')}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full shadow-sm text-slate-700 active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Clientes</h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Directorio</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-full shadow-md text-white active:scale-95 transition-transform"
                >
                    <UserPlus size={20} />
                </button>
            </header>

            <div className="px-4 mt-6">
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p className="text-sm font-bold">Cargando directorio...</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 border-dashed">
                        <Users size={48} className="mb-4 text-slate-300" strokeWidth={1.5} />
                        <p className="text-sm font-bold text-slate-500">No hay clientes</p>
                        <p className="text-xs mt-1 text-center px-8">Registra a tus clientes para tener su historial de compras.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredClients.map(client => (
                            <div key={client.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-inner">
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-bold text-slate-800 text-sm truncate">{client.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        {client.instagram && (
                                            <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                                <Instagram size={12} className="text-pink-500" />
                                                {client.instagram}
                                            </span>
                                        )}
                                        {client.phone && (
                                            <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                                <Phone size={12} className="text-emerald-500" />
                                                {client.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Nuevo Cliente */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-slate-800">Nuevo Cliente</h2>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full">×</button>
                        </div>
                        
                        <form onSubmit={handleSaveClient} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full text-sm border border-slate-200/60 bg-slate-50/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Instagram (Opcional)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                                    <input
                                        type="text"
                                        value={formData.instagram}
                                        onChange={e => setFormData({...formData, instagram: e.target.value})}
                                        className="w-full pl-8 text-sm border border-slate-200/60 bg-slate-50/50 rounded-xl pr-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Teléfono (Opcional)</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    className="w-full text-sm border border-slate-200/60 bg-slate-50/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving || !formData.name.trim()}
                                    className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Guardar Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

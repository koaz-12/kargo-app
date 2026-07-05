'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Wallet, Plus, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';

export default function AccountSettings() {
    const [accounts, setAccounts] = useState<{ id: string, name: string }[]>([]);
    const [newAccount, setNewAccount] = useState('');
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        const { data } = await supabase.from('purchase_accounts').select('*').order('created_at');
        if (data) setAccounts(data);
    };

    const handleAddAccount = async () => {
        if (!newAccount.trim()) return;
        const { error } = await supabase.from('purchase_accounts').insert({ name: newAccount });
        if (!error) {
            setNewAccount('');
            fetchAccounts();
        }
    };

    const handleDeleteAccount = async () => {
        if (!itemToDelete) return;
        const { error } = await supabase.from('purchase_accounts').delete().eq('id', itemToDelete);
        if (!error) fetchAccounts();
        setItemToDelete(null);
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden mb-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 border-b border-slate-100/50">
                <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <Wallet size={16} className="text-slate-400" />
                    Cuentas de Compra
                </p>
                <p className="text-xs text-slate-400 mb-3">Define las cuentas que usas para comprar (Ej. Personal, Business).</p>

                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="Nueva cuenta (ej. Amazon Business)"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newAccount}
                        onChange={(e) => setNewAccount(e.target.value)}
                    />
                    <button
                        onClick={handleAddAccount}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="space-y-2">
                    {accounts.length === 0 && <p className="text-xs text-slate-300 italic">No hay cuentas guardadas.</p>}
                    {accounts.map(acc => (
                        <div key={acc.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-sm font-medium text-slate-700">{acc.name}</span>
                            <button onClick={() => setItemToDelete(acc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {itemToDelete && (
                <ConfirmModal 
                    title="Eliminar Cuenta"
                    message="¿Estás seguro de que quieres borrar esta cuenta de compra?"
                    onConfirm={handleDeleteAccount}
                    onCancel={() => setItemToDelete(null)}
                />
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { LogOut, DollarSign, User, ShieldCheck, CreditCard, Package, Wallet, Trash2, Plus, Globe, FileDown, Database, ArrowLeft, Target, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { Platform, PlatformType } from '../../types/index';

export default function SettingsPage() {
    const [exchangeRate, setExchangeRate] = useState<string>('60.00');
    const [defaultMonthlyGoal, setDefaultMonthlyGoal] = useState<string>('50000');
    const [defaultPlatform, setDefaultPlatform] = useState<string>('TEMU');
    const [email, setEmail] = useState('');
    const [accounts, setAccounts] = useState<{ id: string, name: string }[]>([]);
    const [newAccount, setNewAccount] = useState('');

    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [newPlatformName, setNewPlatformName] = useState('');
    const [newPlatformType, setNewPlatformType] = useState<PlatformType>('OTHER');

    const router = useRouter();

    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        // Load stored rate
        const savedRate = localStorage.getItem('exchangeRate');
        if (savedRate) setExchangeRate(savedRate);

        const savedGoal = localStorage.getItem('defaultMonthlyGoal');
        if (savedGoal) setDefaultMonthlyGoal(savedGoal);

        // Load stored platform
        const savedPlatform = localStorage.getItem('defaultPlatform');
        if (savedPlatform) setDefaultPlatform(savedPlatform);

        // Load user email and preferences
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (user.email) setEmail(user.email);

                // Fetch preferences
                const { data } = await supabase.from('user_preferences').select('display_name').eq('user_id', user.id).single();
                if (data && data.display_name) setDisplayName(data.display_name);
            }
        };
        getUser();

        fetchAccounts();
        fetchPlatforms();
    }, []);

    // ... (fetchPlatforms, handleAddPlatform, etc - kept same)

    const handleDisplayNameChange = async (val: string) => {
        setDisplayName(val);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_preferences').upsert({
                user_id: user.id,
                display_name: val
            });
        }
    };

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

    const handleDeletePlatform = async (id: string) => {
        if (!confirm('¿Borrar esta plataforma?')) return;
        const { error } = await supabase.from('platforms').delete().eq('id', id);
        if (!error) fetchPlatforms();
    };

    const handleExportAll = async () => {
        try {
            const { data, error } = await supabase.from('products').select('*');
            if (error) throw error;
            if (!data || data.length === 0) return alert("No hay datos para exportar");

            const headers = ['Nombre', 'Precio Compra (USD)', 'Costo Envio (USD)', 'Impuestos (USD)', 'Total Costo (DOP)', 'Precio Venta (DOP)', 'Estado', 'Fecha'];
            const csvRows = [headers.join(',')];

            data.forEach(item => {
                const totalCostDOP = (
                    ((item.buy_price + item.shipping_cost + (item.origin_tax || 0)) * item.exchange_rate) +
                    item.tax_cost + (item.local_shipping_cost || 0)
                ).toFixed(2);

                const row = [
                    `"${item.name.replace(/"/g, '""')}"`,
                    item.buy_price,
                    item.shipping_cost,
                    item.origin_tax || 0,
                    totalCostDOP,
                    item.sale_price || 0,
                    item.status,
                    item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
                ];
                csvRows.push(row.join(','));
            });

            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventario_completo_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Error al exportar");
        }
    };

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

    const handleDeleteAccount = async (id: string) => {
        if (!confirm('¿Borrar esta cuenta?')) return;
        const { error } = await supabase.from('purchase_accounts').delete().eq('id', id);
        if (!error) fetchAccounts();
    };

    const handleRateChange = async (val: string) => {
        setExchangeRate(val);
        localStorage.setItem('exchangeRate', val);

        // Save to DB
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_preferences').upsert({
                user_id: user.id,
                default_exchange_rate: Number(val)
            });
        }
    };

    const handlePlatformChange = async (val: string) => {
        setDefaultPlatform(val);
        localStorage.setItem('defaultPlatform', val);

        // Save to DB
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_preferences').upsert({
                user_id: user.id,
                default_platform_id: val
            });
        }
    };

    const handleDefaultGoalChange = (val: string) => {
        setDefaultMonthlyGoal(val);
        localStorage.setItem('defaultMonthlyGoal', val);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="max-w-md mx-auto pb-24 bg-slate-50 min-h-screen">
            <header className="bg-white px-4 py-3 sticky top-0 z-20 border-b border-slate-100 flex items-center gap-3 shadow-sm mb-6">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                    <SettingsIcon size={18} />
                </div>
                <h1 className="text-lg font-black text-slate-800 tracking-tight">Ajustes</h1>
            </header>

            <div className="px-4">

                {/* Profile Section */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                        {email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800">Mi Cuenta</p>
                        <p className="text-xs text-slate-400 mb-1">{email}</p>
                        <input
                            type="text"
                            placeholder="Tu Nombre (ej. Boss)"
                            value={displayName}
                            onChange={(e) => handleDisplayNameChange(e.target.value)}
                            className="text-sm border border-slate-200 rounded px-2 py-1 w-full mt-1 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Platforms Management (New) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                    <div className="p-4 border-b border-slate-100">
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
                                    <button onClick={() => handleDeletePlatform(p.id)} className="text-slate-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Purchase Accounts Management */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                    <div className="p-4 border-b border-slate-100">
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
                                    <button onClick={() => handleDeleteAccount(acc.id)} className="text-slate-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Global Config */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                    <div className="p-4 border-b border-slate-100">
                        <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                            <DollarSign size={16} className="text-slate-400" />
                            Tasa del Dólar (Predeterminada)
                        </p>
                        <p className="text-xs text-slate-400 mb-3">Se usará para todos los nuevos cálculos.</p>
                        <input
                            type="number"
                            value={exchangeRate}
                            onChange={(e) => handleRateChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="p-4 border-b border-slate-100">
                    <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                        <Target size={16} className="text-slate-400" />
                        Meta Mensual (Predeterminada)
                    </p>
                    <p className="text-xs text-slate-400 mb-3">Objetivo inicial para nuevos meses.</p>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">RD$</span>
                        <input
                            type="number"
                            value={defaultMonthlyGoal}
                            onChange={(e) => handleDefaultGoalChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2 font-mono text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="p-4">
                    <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                        <Package size={16} className="text-slate-400" />
                        Plataforma Favorita
                    </p>
                    <p className="text-xs text-slate-400 mb-3">Se seleccionará automáticamente al calcular.</p>
                    <select
                        value={defaultPlatform}
                        onChange={(e) => handlePlatformChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                        <option value="TEMU">Temu</option>
                        <option value="AMAZON">Amazon</option>
                        <option value="ALIEXPRESS">AliExpress</option>
                        <option value="SHEIN">Shein</option>
                        <option value="OTHER">Otro</option>
                    </select>
                </div>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                <div className="p-4 border-b border-slate-100">
                    <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                        <Database size={16} className="text-slate-400" />
                        Datos
                    </p>
                    <p className="text-xs text-slate-400 mb-3">Descarga una copia de seguridad de tu inventario.</p>
                    <button
                        onClick={handleExportAll}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                    >
                        <FileDown size={18} />
                        Exportar Inventario Completo (CSV)
                    </button>
                </div>
            </div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
                <LogOut size={18} />
                Cerrar Sesión
            </button>
        </div>
    );
}

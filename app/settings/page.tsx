'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { LogOut, DollarSign, User, ShieldCheck, CreditCard, Package, Wallet, Trash2, Plus, Globe, FileDown, Database, ArrowLeft, Target, Settings as SettingsIcon, Truck, Star, Tag, Pencil, Check, X, MapPin } from 'lucide-react';
import { useAdjustmentTypes, AdjCategory } from '../../hooks/useAdjustmentTypes';
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

    // Storage Locations
    const [storageLocations, setStorageLocations] = useState<{ id: string, name: string, phone?: string, address?: string, notes?: string }[]>([]);
    const [newLocationName, setNewLocationName] = useState('');
    const [newLocationPhone, setNewLocationPhone] = useState('');

    // Courier Presets
    const [couriers, setCouriers] = useState<{ id: string, name: string, is_default: boolean, identification_pattern?: string }[]>([]);
    const [newCourier, setNewCourier] = useState('');
    const [newCourierPattern, setNewCourierPattern] = useState('');

    // Courier Config
    const [courierDiscount, setCourierDiscount] = useState<string>('0');
    const [localShippingDefault, setLocalShippingDefault] = useState<string>('0');

    // Adjustment Types
    const { types: adjTypes, loading: adjTypesLoading, addType: addAdjType, editType: editAdjType, deleteType: deleteAdjType } = useAdjustmentTypes();
    const [newAdjLabel, setNewAdjLabel] = useState('');
    const [newAdjDesc, setNewAdjDesc] = useState('');
    const [newAdjCategory, setNewAdjCategory] = useState<AdjCategory>('CREDIT');
    const [editingAdjId, setEditingAdjId] = useState<string | null>(null);
    const [editAdjValues, setEditAdjValues] = useState<{ label: string; description: string; category: AdjCategory }>({ label: '', description: '', category: 'CREDIT' });

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
                const { data } = await supabase.from('user_preferences')
                    .select('display_name, default_courier_discount, default_local_shipping, default_monthly_goal')
                    .eq('user_id', user.id)
                    .single();

                if (data) {
                    if (data.display_name) setDisplayName(data.display_name);
                    if (data.default_courier_discount) setCourierDiscount(data.default_courier_discount.toString());
                    if (data.default_local_shipping) setLocalShippingDefault(data.default_local_shipping.toString());
                    if (data.default_monthly_goal) setDefaultMonthlyGoal(data.default_monthly_goal.toString());
                }
            }
        };
        getUser();

        fetchAccounts();
        fetchPlatforms();
        fetchCouriers();
        fetchStorageLocations();
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

    // Courier Management Functions
    const fetchCouriers = async () => {
        const { data } = await supabase
            .from('courier_presets')
            .select('*')
            .order('display_order');
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
            is_default: couriers.length === 0 // First courier is default
        });

        if (!error) {
            setNewCourier('');
            setNewCourierPattern('');
            fetchCouriers();
        }
    };

    const handleDeleteCourier = async (id: string) => {
        if (!confirm('¿Borrar este courier?')) return;
        const { error } = await supabase.from('courier_presets').delete().eq('id', id);
        if (!error) fetchCouriers();
    };

    const handleSetDefaultCourier = async (id: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // First, unset all defaults
        await supabase
            .from('courier_presets')
            .update({ is_default: false })
            .eq('user_id', user.id);

        // Then set the selected one as default
        const { error } = await supabase
            .from('courier_presets')
            .update({ is_default: true })
            .eq('id', id);

        if (!error) fetchCouriers();
    };

    // Storage Locations Management
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

    const handleDeleteLocation = async (id: string) => {
        if (!confirm('¿Borrar esta ubicación? Los productos asignados quedarán sin ubicación.')) return;
        const { error } = await supabase.from('storage_locations').delete().eq('id', id);
        if (!error) fetchStorageLocations();
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

    const handleDefaultGoalChange = async (val: string) => {
        setDefaultMonthlyGoal(val);
        // Save to DB
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_preferences').upsert({
                user_id: user.id,
                default_monthly_goal: Number(val)
            });
        }
    };

    const handleCourierDiscountChange = async (val: string) => {
        setCourierDiscount(val);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_preferences').upsert({
                user_id: user.id,
                default_courier_discount: Number(val)
            });
        }
    };

    const handleLocalShippingDefaultChange = async (val: string) => {
        setLocalShippingDefault(val);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_preferences').upsert({
                user_id: user.id,
                default_local_shipping: Number(val)
            });
        }
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

                {/* Couriers Management */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                    <div className="p-4 border-b border-slate-100">
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
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddCourier()}
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
                                            onClick={() => handleDeleteCourier(courier.id)}
                                            className="text-slate-400 hover:text-red-500 ml-2 p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Storage Locations Management */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                    <div className="p-4 border-b border-slate-100">
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
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
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
                                    <button onClick={() => handleDeleteLocation(loc.id)} className="text-slate-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Adjustment Types Management */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                    <div className="p-4">
                        <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                            <Tag size={16} className="text-slate-400" />
                            Tipos de Ajuste / Créditos
                        </p>
                        <p className="text-xs text-slate-400 mb-4">Gestiona los créditos y descuentos disponibles al registrar un producto.</p>

                        {/* --- CREATE FORM --- */}
                        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 mb-4 space-y-2.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Nuevo Tipo</p>

                            {/* Category toggle */}
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

                            {/* Helper text for selected category */}
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

                            {/* Group by category */}
                            {['CREDIT', 'DISCOUNT'].map(cat => {
                                const group = adjTypes.filter(t => (t.category || 'CREDIT') === cat);
                                if (group.length === 0) return null;
                                return (
                                    <div key={cat} className="mb-3">
                                        <p className={`text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1 ${cat === 'CREDIT' ? 'text-blue-500' : 'text-emerald-500'
                                            }`}>
                                            {cat === 'CREDIT' ? '💳 Créditos (quedan en la plataforma)' : '🏷️ Descuentos (aplicados al comprar)'}
                                        </p>
                                        <div className="space-y-1.5">
                                            {group.map(t => (
                                                <div key={t.id} className={`rounded-xl border p-3 ${cat === 'CREDIT' ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'
                                                    }`}>
                                                    {editingAdjId === t.id ? (
                                                        /* --- EDIT MODE --- */
                                                        <div className="space-y-2">
                                                            {/* Category toggle in edit mode */}
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
                                                        /* --- VIEW MODE --- */
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

                <div className="p-4 border-b border-slate-100">
                    <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                        <DollarSign size={16} className="text-slate-400" />
                        Descuento Courier (Predeterminado)
                    </p>
                    <p className="text-xs text-slate-400 mb-3">Se aplicará con el botón mágico en "Pago Courier".</p>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">%</span>
                        <input
                            type="number"
                            value={courierDiscount}
                            onChange={(e) => handleCourierDiscountChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2 font-mono text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="p-4 border-b border-slate-100">
                    <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                        <DollarSign size={16} className="text-slate-400" />
                        Envío Local (Predeterminado)
                    </p>
                    <p className="text-xs text-slate-400 mb-3">Costo de envío local por defecto al crear productos.</p>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">RD$</span>
                        <input
                            type="number"
                            value={localShippingDefault}
                            onChange={(e) => handleLocalShippingDefaultChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2 font-mono text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0"
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

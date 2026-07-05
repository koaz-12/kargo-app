'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { DollarSign, Target, Package, FileDown, Database } from 'lucide-react';
import { toast } from 'sonner';

interface FinancialDefaultsProps {
    platforms?: any[];
}

export default function FinancialDefaults({ platforms }: FinancialDefaultsProps) {
    const [exchangeRate, setExchangeRate] = useState<string>('60.00');
    const [defaultMonthlyGoal, setDefaultMonthlyGoal] = useState<string>('50000');
    const [defaultPlatform, setDefaultPlatform] = useState<string>('TEMU');
    const [courierDiscount, setCourierDiscount] = useState<string>('0');
    const [localShippingDefault, setLocalShippingDefault] = useState<string>('0');
    const [poundRate, setPoundRate] = useState<string>('280');

    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const savedRate = localStorage.getItem('exchangeRate');
        if (savedRate) setExchangeRate(savedRate);

        const savedGoal = localStorage.getItem('defaultMonthlyGoal');
        if (savedGoal) setDefaultMonthlyGoal(savedGoal);

        const savedPlatform = localStorage.getItem('defaultPlatform');
        if (savedPlatform) setDefaultPlatform(savedPlatform);

        const loadPreferences = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('user_preferences')
                    .select('default_courier_discount, default_local_shipping, default_monthly_goal, default_pound_rate')
                    .eq('user_id', user.id)
                    .single();

                if (data) {
                    if (data.default_courier_discount) setCourierDiscount(data.default_courier_discount.toString());
                    if (data.default_local_shipping) setLocalShippingDefault(data.default_local_shipping.toString());
                    if (data.default_monthly_goal) setDefaultMonthlyGoal(data.default_monthly_goal.toString());
                    if (data.default_pound_rate) setPoundRate(data.default_pound_rate.toString());
                }
            }
        };
        loadPreferences();
    }, []);

    const savePreference = async (field: string, value: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_preferences').upsert({
                user_id: user.id,
                [field]: value
            });
        }
    };

    const debouncedSave = (field: string, value: any) => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            savePreference(field, value);
        }, 600);
    };

    const handleRateChange = (val: string) => {
        setExchangeRate(val);
        localStorage.setItem('exchangeRate', val);
        debouncedSave('default_exchange_rate', Number(val));
    };

    const handleDefaultGoalChange = (val: string) => {
        setDefaultMonthlyGoal(val);
        debouncedSave('default_monthly_goal', Number(val));
    };

    const handleCourierDiscountChange = (val: string) => {
        setCourierDiscount(val);
        debouncedSave('default_courier_discount', Number(val));
    };

    const handleLocalShippingDefaultChange = (val: string) => {
        setLocalShippingDefault(val);
        debouncedSave('default_local_shipping', Number(val));
    };

    const handlePoundRateChange = (val: string) => {
        setPoundRate(val);
        debouncedSave('default_pound_rate', Number(val));
    };

    const handlePlatformChange = (val: string) => {
        setDefaultPlatform(val);
        localStorage.setItem('defaultPlatform', val);
        savePreference('default_platform_id', val);
    };

    const handleExportAll = async () => {
        try {
            const { data, error } = await supabase.from('products').select('*');
            if (error) throw error;
            if (!data || data.length === 0) return toast.info("No hay datos para exportar");

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
            toast.error("Error al exportar");
        }
    };

    return (
        <>
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden mb-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 border-b border-slate-100/50">
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

                <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 border-b border-slate-100/50">
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

                <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 border-b border-slate-100/50">
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

                <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 border-b border-slate-100/50">
                    <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                        <Package size={16} className="text-slate-400" />
                        Tasa de la Libra (Courier)
                    </p>
                    <p className="text-xs text-slate-400 mb-3">El costo predeterminado por libra (ej. 280).</p>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">RD$</span>
                        <input
                            type="number"
                            value={poundRate}
                            onChange={(e) => handlePoundRateChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2 font-mono text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="280"
                        />
                    </div>
                </div>

                <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 border-b border-slate-100/50">
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
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden mb-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 border-b border-slate-100/50">
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
        </>
    );
}

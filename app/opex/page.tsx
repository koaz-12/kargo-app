'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingDown, Plus, CreditCard, Box, Truck, Monitor, Users, MoreHorizontal, Loader2, Search } from 'lucide-react';
import { OperatingExpense } from '../../types';
import { toast } from 'sonner';

const CATEGORIES = [
    { id: 'MARKETING', label: 'Publicidad', icon: TrendingDown, color: 'text-pink-500', bg: 'bg-pink-100' },
    { id: 'PACKAGING', label: 'Empaques', icon: Box, color: 'text-orange-500', bg: 'bg-orange-100' },
    { id: 'SHIPPING', label: 'Envíos', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'SOFTWARE', label: 'Software', icon: Monitor, color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { id: 'SALARY', label: 'Nómina', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-100' },
    { id: 'OTHER', label: 'Otros', icon: MoreHorizontal, color: 'text-slate-500', bg: 'bg-slate-100' },
];

export default function OpexPage() {
    const router = useRouter();
    const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({ category: 'MARKETING', amount: '', notes: '', expense_date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('operating_expenses')
                .select('*')
                .order('expense_date', { ascending: false });
            
            if (error) throw error;
            setExpenses(data || []);
        } catch (error: any) {
            console.error('Error fetching expenses:', error);
            toast.error('Error al cargar gastos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || Number(formData.amount) <= 0) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('operating_expenses')
                .insert([{
                    category: formData.category,
                    amount: Number(formData.amount),
                    notes: formData.notes,
                    expense_date: new Date(formData.expense_date).toISOString()
                }]);
            
            if (error) throw error;
            
            toast.success('Gasto registrado exitosamente');
            setIsModalOpen(false);
            setFormData({ category: 'MARKETING', amount: '', notes: '', expense_date: new Date().toISOString().split('T')[0] });
            loadExpenses();
        } catch (error: any) {
            console.error('Error saving expense:', error);
            toast.error('Error al registrar el gasto');
        } finally {
            setIsSaving(false);
        }
    };

    const getCategoryConfig = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[5];
    const totalOpex = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 relative">
            <header className="sticky top-0 z-20 pt-6 pb-4 pl-4 pr-16 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center gap-3">
                <button
                    onClick={() => router.push('/')}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full shadow-sm text-slate-700 active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Gastos (Opex)</h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Costos Operativos</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-10 h-10 flex items-center justify-center bg-rose-500 rounded-full shadow-md text-white active:scale-95 transition-transform"
                >
                    <Plus size={20} />
                </button>
            </header>

            <div className="px-4 mt-6">
                {/* Total Summary Card */}
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-5 text-white shadow-xl shadow-rose-200 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-rose-100 font-bold text-sm tracking-wide">Gasto Total Histórico</span>
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <CreditCard size={20} className="text-white" />
                        </div>
                    </div>
                    <span className="text-3xl font-black tracking-tighter block mt-2">
                        RD$ {totalOpex.toLocaleString('es-DO')}
                    </span>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p className="text-sm font-bold">Cargando gastos...</p>
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 border-dashed">
                        <TrendingDown size={48} className="mb-4 text-slate-300" strokeWidth={1.5} />
                        <p className="text-sm font-bold text-slate-500">Sin gastos operativos</p>
                        <p className="text-xs mt-1 text-center px-8">Registra tus gastos mensuales aquí para calcular tu Ganancia Neta Real.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Historial de Gastos</h3>
                        {expenses.map(expense => {
                            const config = getCategoryConfig(expense.category);
                            const Icon = config.icon;
                            return (
                                <div key={expense.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl ${config.bg} flex items-center justify-center shrink-0`}>
                                        <Icon size={24} className={config.color} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-slate-800 text-sm">{config.label}</h3>
                                            <span className="font-black text-slate-800">-RD${Number(expense.amount).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs text-slate-500 truncate max-w-[150px]">{expense.notes || 'Sin detalles'}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{new Date(expense.expense_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de Nuevo Gasto */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <TrendingDown className="text-rose-500" /> Nuevo Gasto
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full">×</button>
                        </div>
                        
                        <form onSubmit={handleSaveExpense} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Categoría</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {CATEGORIES.map(cat => {
                                        const CatIcon = cat.icon;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setFormData({...formData, category: cat.id})}
                                                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${formData.category === cat.id ? `bg-slate-800 border-slate-800 text-white shadow-md` : `bg-white border-slate-200 text-slate-500 hover:bg-slate-50`}`}
                                            >
                                                <CatIcon size={18} className={formData.category === cat.id ? 'text-white' : cat.color} />
                                                <span className="text-[9px] font-bold">{cat.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Monto (RD$)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.amount}
                                        onChange={e => setFormData({...formData, amount: e.target.value})}
                                        className="w-full pl-8 text-lg font-black text-slate-800 border border-slate-200/60 bg-slate-50/50 rounded-xl pr-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Fecha</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.expense_date}
                                    onChange={e => setFormData({...formData, expense_date: e.target.value})}
                                    className="w-full text-sm border border-slate-200/60 bg-slate-50/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Detalles / Nota</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Bolsas de burbujas"
                                    value={formData.notes}
                                    onChange={e => setFormData({...formData, notes: e.target.value})}
                                    className="w-full text-sm border border-slate-200/60 bg-slate-50/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                                />
                            </div>
                            
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving || !formData.amount}
                                    className="w-full bg-rose-500 text-white font-bold py-3.5 rounded-xl shadow-md shadow-rose-200 hover:bg-rose-600 transition-colors disabled:opacity-50 flex justify-center"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Registrar Gasto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

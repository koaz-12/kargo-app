'use client';
import { useState } from 'react';
import DashboardStats from '../components/DashboardStats';
import ProductList from '../components/products/ProductList';
import { Plus, Package, CheckCircle2, Store, Users, TrendingDown, DollarSign, LayoutDashboard, Briefcase, LineChart } from 'lucide-react';
import Link from 'next/link';
import { useProducts } from '../hooks/useProducts';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { DashboardStatsSkeleton } from '../components/ui/Skeleton';
import FinancialProjections from '../components/dashboard/FinancialProjections';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import { useActivityLogs } from '../hooks/useActivityLogs';

export default function Home() {
    // Use React Query hook for products
    const { data: products = [], isLoading: loading } = useProducts();
    const { data: activityLogs = [], isLoading: loadingLogs } = useActivityLogs();
    const { userName } = useUserPreferences();
    const [activeTab, setActiveTab] = useState<'resumen' | 'operaciones' | 'finanzas'>('resumen');

    // Default goal since we don't have a hook for it yet
    const monthlyGoal = 50000;

    return (
        <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-28 max-w-md mx-auto relative">
            <header className="sticky top-0 z-20 pt-6 pb-2 pl-4 pr-16 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl mb-2">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                            Hola, {userName || 'Reseller'} 👋
                        </h1>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">Inicio</p>
                    </div>
                </div>
                
                {/* Tabs Navigation */}
                <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('resumen')}
                        className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === 'resumen' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <LayoutDashboard size={14} strokeWidth={2.5} />
                        Resumen
                    </button>
                    <button 
                        onClick={() => setActiveTab('operaciones')}
                        className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === 'operaciones' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Briefcase size={14} strokeWidth={2.5} />
                        Acciones
                    </button>
                    <button 
                        onClick={() => setActiveTab('finanzas')}
                        className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === 'finanzas' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <LineChart size={14} strokeWidth={2.5} />
                        Finanzas
                    </button>
                </div>
            </header>

            <div className="px-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* TAB 1: RESUMEN E INVENTARIO */}
                {activeTab === 'resumen' && (
                    <div className="space-y-4 mt-4">
                        {loading ? <DashboardStatsSkeleton /> : <DashboardStats products={products} />}
                        <div className="relative mt-2">
                            <ProductList />
                        </div>
                    </div>
                )}

                {/* TAB 2: OPERACIONES RÁPIDAS */}
                {activeTab === 'operaciones' && (
                    <div className="mt-4">
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {/* Add Button */}
                            <Link href="/calculator" className="col-span-1 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200/50 dark:shadow-none flex flex-col justify-between h-[100px] hover:-translate-y-0.5 active:scale-95 transition-all relative overflow-hidden group">
                                <div className="bg-white/20 w-8 h-8 rounded-xl flex items-center justify-center mb-1 group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                                    <Plus size={18} strokeWidth={3} />
                                </div>
                                <div className="relative z-10">
                                    <span className="text-[10px] font-medium text-indigo-100 block leading-tight">Añadir Nuevo</span>
                                    <span className="text-sm font-black block leading-tight">Producto</span>
                                </div>
                                <Plus className="absolute -right-3 -bottom-3 text-white/10 w-24 h-24 rotate-12 transition-transform group-hover:scale-110" />
                            </Link>

                            {/* Stock Shortcut */}
                            <Link href="/inventory?tab=RECEIVED" className="col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between h-[100px] hover:-translate-y-0.5 active:scale-95 transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="bg-emerald-50 dark:bg-emerald-900/30 w-8 h-8 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                        <Package size={18} strokeWidth={2.5} />
                                    </div>
                                    <span className="font-black text-2xl text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                                        {products.filter(p => p.status === 'RECEIVED').length}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">En Stock</span>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Ver lista</span>
                                </div>
                            </Link>
                            
                            {/* Marketplace Button */}
                            <Link href="/marketplace" className="col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200/50 dark:shadow-none mb-2 flex items-center justify-between active:scale-95 hover:-translate-y-0.5 transition-all relative overflow-hidden group">
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform">
                                        <Store size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <span className="font-black block text-base">Marketplace FB</span>
                                        <span className="text-[11px] text-blue-100 block font-medium">Plantillas Inteligentes para publicar rápido</span>
                                    </div>
                                </div>
                                <div className="text-white/80 font-bold text-xl relative z-10 group-hover:translate-x-1 transition-transform">
                                    →
                                </div>
                            </Link>

                            {/* Orders History Button */}
                            <Link href="/orders" className="col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center justify-between active:scale-95 hover:-translate-y-0.5 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="bg-amber-50 dark:bg-amber-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 transition-colors">
                                        <Package size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <span className="font-black text-slate-800 dark:text-slate-100 block text-sm">Historial de Pedidos</span>
                                        <span className="text-[11px] text-slate-500 block font-medium">Ventas y Apartados</span>
                                    </div>
                                </div>
                                <div className="text-slate-300 dark:text-slate-600 font-bold text-xl group-hover:text-slate-400 transition-colors group-hover:translate-x-1">
                                    →
                                </div>
                            </Link>

                            {/* Clients Directory Button */}
                            <Link href="/clients" className="col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center justify-between active:scale-95 hover:-translate-y-0.5 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="bg-purple-50 dark:bg-purple-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 transition-colors">
                                        <Users size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <span className="font-black text-slate-800 dark:text-slate-100 block text-sm">Directorio de Clientes</span>
                                        <span className="text-[11px] text-slate-500 block font-medium">Gestionar base de datos</span>
                                    </div>
                                </div>
                                <div className="text-slate-300 dark:text-slate-600 font-bold text-xl group-hover:text-slate-400 transition-colors group-hover:translate-x-1">
                                    →
                                </div>
                            </Link>

                            {/* Inventory Review Button */}
                            <Link href="/inventory/review" className="col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center justify-between active:scale-95 hover:-translate-y-0.5 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-slate-100 transition-colors">
                                        <CheckCircle2 size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <span className="font-black text-slate-800 dark:text-slate-100 block text-sm">Revisión Fina</span>
                                        <span className="text-[11px] text-slate-500 block font-medium">Auditar inventario físico</span>
                                    </div>
                                </div>
                                <div className="text-slate-300 dark:text-slate-600 font-bold text-xl group-hover:text-slate-400 transition-colors group-hover:translate-x-1">
                                    →
                                </div>
                            </Link>
                        </div>
                    </div>
                )}

                {/* TAB 3: FINANZAS Y ACTIVIDAD */}
                {activeTab === 'finanzas' && (
                    <div className="mt-4 space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/opex" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col items-center text-center hover:-translate-y-0.5 transition-all group">
                                <div className="bg-rose-50 dark:bg-rose-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-rose-500 dark:text-rose-400 group-hover:bg-rose-100 transition-colors mb-3">
                                    <TrendingDown size={24} strokeWidth={2.5} />
                                </div>
                                <span className="font-black text-slate-800 dark:text-slate-100 block text-sm">Gastos Fijos</span>
                                <span className="text-[10px] text-slate-500 font-medium">Control de Opex</span>
                            </Link>
                            
                            <Link href="/calculator" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col items-center text-center hover:-translate-y-0.5 transition-all group">
                                <div className="bg-emerald-50 dark:bg-emerald-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 transition-colors mb-3">
                                    <DollarSign size={24} strokeWidth={2.5} />
                                </div>
                                <span className="font-black text-slate-800 dark:text-slate-100 block text-sm">Simulador</span>
                                <span className="text-[10px] text-slate-500 font-medium">Calculadora</span>
                            </Link>
                        </div>
                        
                        <FinancialProjections products={products} monthlyGoal={monthlyGoal || 50000} />
                        
                        <ActivityTimeline logs={activityLogs} loading={loadingLogs} />
                    </div>
                )}
            </div>
        </main>
    );
}

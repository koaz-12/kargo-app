'use client';
import DashboardStats from '../components/DashboardStats';
import ProductList from '../components/products/ProductList';
import { Plus, Package } from 'lucide-react';
import Link from 'next/link';
import { useProducts } from '../hooks/useProducts';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { DashboardStatsSkeleton } from '../components/ui/Skeleton';
import { UtilitiesMenu } from '../components/UtilitiesMenu';
import { useStorageLocations } from '../hooks/useStorageLocations';
import { MapPin, FileDown, CheckCircle2, Store } from 'lucide-react';

export default function Home() {
    // Use React Query hook for products
    const { data: products = [], isLoading: loading } = useProducts();
    const { userName } = useUserPreferences();

    return (
        <main className="min-h-screen bg-slate-50/50 pb-28 max-w-md mx-auto relative">
            <header className="sticky top-0 z-20 pt-6 pb-4 px-4 bg-slate-50/80 backdrop-blur-xl mb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                            Hola, {userName || 'Reseller'} 👋
                        </h1>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">Resumen Diario</p>
                    </div>
                </div>
            </header>

            <div className="px-4">
                {/* 1. STATS SUMMARY (Top) */}
                {loading ? <DashboardStatsSkeleton /> : <DashboardStats products={products} />}

                {/* 2. QUICK ACTIONS (Priority #2) */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Add Button */}
                    <Link href="/calculator" className="col-span-1 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200/50 flex flex-col justify-between h-[100px] hover:-translate-y-0.5 active:scale-95 transition-all relative overflow-hidden group">
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
                    <Link href="/inventory?tab=RECEIVED" className="col-span-1 bg-white border border-slate-100 p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between h-[100px] hover:-translate-y-0.5 active:scale-95 transition-all group">
                        <div className="flex justify-between items-start">
                            <div className="bg-emerald-50 w-8 h-8 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                <Package size={18} strokeWidth={2.5} />
                            </div>
                            <span className="font-black text-2xl text-slate-800 tracking-tight leading-none">
                                {products.filter(p => p.status === 'RECEIVED').length}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">En Stock</span>
                            <span className="text-xs font-bold text-slate-600 block">Ver lista</span>
                        </div>
                    </Link>
                    
                    {/* Marketplace Button */}
                    <Link href="/marketplace" className="col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200/50 mb-2 flex items-center justify-between active:scale-95 hover:-translate-y-0.5 transition-all relative overflow-hidden group">
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
                        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white/10 to-transparent skew-x-12 translate-x-8 group-hover:translate-x-0 transition-transform duration-500" />
                    </Link>
                    {/* Inventory Review Button */}
                    <Link href="/inventory/review" className="col-span-2 bg-white border border-slate-100 p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center justify-between active:scale-95 hover:-translate-y-0.5 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-slate-100 transition-colors">
                                <CheckCircle2 size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="font-black text-slate-800 block text-sm">Revisión Fina</span>
                                <span className="text-[11px] text-slate-500 block font-medium">Auditar inventario físico</span>
                            </div>
                        </div>
                        <div className="text-slate-300 font-bold text-xl group-hover:text-slate-400 transition-colors group-hover:translate-x-1">
                            →
                        </div>
                    </Link>
                </div>

                {/* 3. PRODUCT LIST (Search + Filters + Items) (Bottom) */}
                <div className="relative">
                    <ProductList />
                </div>
            </div>

            {/* Utilities Menu - Only on Home Page */}
            <UtilitiesMenu />
        </main>
    );
}

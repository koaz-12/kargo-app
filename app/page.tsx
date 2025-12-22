'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import DashboardStats from '../components/DashboardStats';
import ProductList from '../components/products/ProductList';
import { Plus, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Product } from '../types';

export default function Home() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetch = async () => {
            // Get User & Name
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: prefs } = await supabase.from('user_preferences').select('display_name').eq('user_id', user.id).single();
                if (prefs?.display_name) {
                    setUserName(prefs.display_name);
                } else if (user.email) {
                    setUserName(user.email.split('@')[0]);
                }
            }

            // Get Data
            const { data } = await supabase.from('products').select('*');
            if (data) setProducts(data);
            setLoading(false);
        };
        fetch();
    }, []);

    return (
        <main className="min-h-screen bg-slate-50 pb-24 max-w-md mx-auto shadow-2xl shadow-slate-200">
            <header className="bg-white px-4 py-3 sticky top-0 z-20 border-b border-slate-100 shadow-sm mb-4 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-lg font-black text-slate-800 capitalize leading-tight">Hola, {userName || 'Reseller'} 👋</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Resumen</p>
                </div>
            </header>

            <div className="px-4">
                {/* 1. STATS SUMMARY (Top) */}
                {!loading && <DashboardStats products={products} />}

                {/* 2. QUICK ACTIONS (Priority #2) */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Add Button */}
                    <Link href="/calculator" className="col-span-1 bg-slate-900 text-white p-3 rounded-xl shadow-lg shadow-slate-200 flex flex-col justify-between h-24 active:scale-95 transition-transform relative overflow-hidden group">
                        <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center mb-2 group-hover:bg-white/20 transition-colors">
                            <Plus size={18} />
                        </div>
                        <div>
                            <span className="text-[10px] font-medium opacity-80 block">Nuevo</span>
                            <span className="text-sm font-bold block">Producto</span>
                        </div>
                        <Plus className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24 rotate-12" />
                    </Link>

                    {/* Stock Shortcut */}
                    <Link href="/inventory?tab=RECEIVED" className="col-span-1 bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col justify-between h-24 active:scale-95 transition-transform relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div className="bg-emerald-50 w-8 h-8 rounded-full flex items-center justify-center text-emerald-600">
                                <Package size={18} />
                            </div>
                            <span className="font-black text-xl text-slate-800">
                                {products.filter(p => p.status === 'RECEIVED').length}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">En Stock</span>
                            <span className="text-xs font-bold text-slate-600 block">Ver Disponibles</span>
                        </div>
                    </Link>
                </div>

                {/* 3. PRODUCT LIST (Search + Filters + Items) (Bottom) */}
                <div className="relative">
                    <ProductList />
                </div>
            </div>
        </main>
    );
}

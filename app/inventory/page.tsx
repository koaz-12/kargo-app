import ProductList from "../../components/products/ProductList";
import { Package } from 'lucide-react';

export default function InventoryPage() {
    return (

        <main className="min-h-screen bg-slate-50/50 pb-28 max-w-md mx-auto relative">
            <header className="sticky top-0 z-20 pt-6 pb-4 pl-4 pr-16 bg-slate-50/80 backdrop-blur-xl mb-2 border-b border-slate-200/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Package size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Mi Inventario</h1>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Historial General</p>
                    </div>
                </div>
                <a href="/inventory/audit" className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="10" height="10" rx="2"></rect></svg>
                </a>
            </header>
            <ProductList />
        </main>
    );
}

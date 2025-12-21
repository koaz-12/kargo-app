import ProductList from "../../components/products/ProductList";
import { Package } from 'lucide-react';

export default function InventoryPage() {
    return (

        <main className="min-h-screen bg-slate-50 pb-24 max-w-md mx-auto shadow-2xl shadow-slate-200">
            <header className="bg-white px-4 py-3 sticky top-0 z-20 border-b border-slate-100 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                    <Package size={18} />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">Mi Inventario</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Historial</p>
                </div>
            </header>
            <ProductList />
        </main>
    );
}

import ProductList from "../../components/products/ProductList";

export default function InventoryPage() {
    return (
        <main className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white px-4 py-3 sticky top-0 z-20 border-b border-slate-100 flex flex-col items-center justify-center shadow-sm text-center">
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">Mi Inventario</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Historial</p>
            </header>
            <ProductList />
        </main>
    );
}

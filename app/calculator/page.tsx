import ProductForm from "../../components/products/ProductForm";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CalculatorPage({ searchParams }: { searchParams: { edit?: string } }) {
    const editingId = searchParams.edit;

    return (
        <main className="min-h-screen bg-slate-50 pb-24 max-w-md mx-auto shadow-2xl shadow-slate-200">
            <header className="bg-white px-4 py-3 sticky top-0 z-20 border-b border-slate-100 flex items-center gap-3 shadow-sm mb-4">
                <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-lg font-black text-slate-800 tracking-tight">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h1>
            </header>

            <ProductForm editingId={editingId} />
        </main>
    );
}

import ProductForm from "../../components/products/ProductForm";


export default function CalculatorPage({ searchParams }: { searchParams: { edit?: string } }) {
    const editingId = searchParams.edit;

    return (
        <main className="min-h-screen bg-slate-50 pb-40 max-w-md mx-auto shadow-2xl shadow-slate-200">
            <ProductForm editingId={editingId} />
        </main>
    );
}

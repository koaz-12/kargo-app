import ProductForm from "../../components/products/ProductForm";


export default function CalculatorPage({ searchParams }: { searchParams: { edit?: string } }) {
    const editingId = searchParams.edit;

    return (
        <main className="min-h-screen bg-slate-50/50 pb-24 max-w-md mx-auto relative">
            <ProductForm editingId={editingId} />
        </main>
    );
}

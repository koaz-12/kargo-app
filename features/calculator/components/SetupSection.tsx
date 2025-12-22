import Link from 'next/link';
import ProductNameInput from '../../../components/products/ProductNameInput'; // Moving later
import ImageUploader from '../../../components/products/ImageUploader'; // Moving later
import { FormState, FormSetters, Platform } from '../../../types';

interface Account {
    id: string;
    name: string;
}

interface SetupSectionProps {
    formState: FormState;
    setters: FormSetters;
    platforms: Platform[];
    accounts: Account[];
    editingId: string | null;
}

export default function SetupSection({
    formState,
    setters,
    platforms,
    accounts,
    editingId
}: SetupSectionProps) {
    return (
        <section className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Configuración</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Plataforma</label>
                    <select
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-700 outline-none focus:border-slate-400 transition-colors"
                        value={formState.platformId}
                        onChange={(e) => setters.setPlatformId(e.target.value)}
                    >
                        <option value="">-- Seleccionar --</option>
                        {platforms.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Cuenta de Compra</label>
                    <select
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-700 outline-none focus:border-slate-400 transition-colors"
                        value={formState.purchaseAccountId || ''}
                        onChange={(e) => setters.setPurchaseAccountId(e.target.value)}
                    >
                        <option value="">-- General --</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Product Name Input */}
            <div className="mb-1">
                <ProductNameInput
                    value={formState.name}
                    onChange={setters.setName}
                    onSelectHistory={(product) => {
                        // Smart Fill Logic (User Request: Name + Buy Price + Image)
                        setters.setName(product.name);
                        setters.setBuyPrice(product.buy_price);

                        // Autofill Image if available
                        if (product.image_url) {
                            setters.setImages([product.image_url]);
                        } else if (product.images && product.images.length > 0) {
                            setters.setImages(product.images);
                        }

                        // Explicitly NOT filling other variable costs as they change per shipment
                        // setters.setShippingCost(product.shipping_cost);
                        // setters.setTaxCost(product.tax_cost || 0);
                        // setters.setLocalShipping(product.local_shipping_cost || 0);
                        // setters.setSalePrice(product.sale_price || 0);
                        // setters.setOriginTax(product.origin_tax || 0);
                    }}
                />
            </div>

            {/* Image Uploader */}
            <div className="mb-1">
                <ImageUploader
                    images={formState.images || []}
                    setImages={setters.setImages}
                    productId={editingId || undefined}
                />
            </div>
        </section>
    );
}

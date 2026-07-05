import Link from 'next/link';
import ProductNameInput from '../../../components/products/ProductNameInput'; // Moving later
import ImageUploader from '../../../components/products/ImageUploader'; // Moving later
import { FormState, FormSetters, Platform } from '../../../types';
import { useStorageLocations } from '../../../hooks/useStorageLocations';
import { MapPin } from 'lucide-react';

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
    const { data: storageLocations = [] } = useStorageLocations();

    return (
        <section className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                Configuración
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Plataforma</label>
                    <select
                        className="w-full text-sm font-semibold bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
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
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Cuenta de Compra</label>
                    <select
                        className="w-full text-sm font-semibold bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
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

            {/* Storage Location Dropdown */}
            {storageLocations.length > 0 && (
                <div className="mb-4">
                    <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-1">
                        <MapPin size={12} className="text-slate-400" />
                        Ubicación / Almacén
                    </label>
                    <select
                        className="w-full text-sm font-semibold bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                        value={(formState as any).storageLocationId || ''}
                        onChange={(e) => (setters as any).setStorageLocationId?.(e.target.value)}
                    >
                        <option value="">-- Sin asignar --</option>
                        {storageLocations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Product Name Input */}
            <div className="mb-1">
                <ProductNameInput
                    value={formState.name}
                    onChange={setters.setName}
                    onSelectHistory={(product) => {
                        // Smart Fill Logic (User Request: Name + Buy Price + Image + SKU)
                        setters.setName(product.name);
                        setters.setBuyPrice(product.buy_price);
                        
                        if (product.sku) {
                            setters.setSku(product.sku);
                        }

                        // Autofill Image if available
                        if (product.image_url) {
                            setters.setImages([product.image_url]);
                        } else if (product.images && product.images.length > 0) {
                            // Map ProductImage[] ({ storage_path }) to string[]
                            const paths = product.images.map((img: any) => img.storage_path);
                            setters.setImages(paths);
                        }
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

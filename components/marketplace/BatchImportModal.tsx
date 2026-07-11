import { useState } from 'react';
import { MarketplaceListing } from '../../types';
import { Sparkles, X, Copy, Check, Info } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploader from '../products/ImageUploader';
import ProductSelector from '../ui/ProductSelector';

interface BatchImportModalProps {
    onClose: () => void;
    onSave: (listings: Omit<MarketplaceListing, 'id' | 'user_id' | 'created_at'>[]) => Promise<void>;
}

export default function BatchImportModal({ onClose, onSave }: BatchImportModalProps) {
    const [jsonText, setJsonText] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [previewListings, setPreviewListings] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    
    // New states for the workflow
    const [batchType, setBatchType] = useState<'variations' | 'different_products'>('variations');
    const [productName, setProductName] = useState('');
    const [productSkus, setProductSkus] = useState<string[]>([]);

    const productPlaceholder = productName.trim() || "[ESCRIBE TU PRODUCTO O LISTA AQUÍ]";
    
    const promptText = batchType === 'variations' 
        ? `Actúa como Copywriter Experto en Ventas para FB Marketplace. \nGenera 3 variaciones de plantillas de ventas (oferta, beneficios, directa) para este producto: ${productPlaceholder}.\n\nSigue estas reglas para cada variación:\n1. Título SEO atractivo.\n2. Descripción con viñetas (✅) beneficios y emojis.\n3. Llamado a la acción y estado del producto.\n4. Genera EXACTAMENTE 20 etiquetas (tags) optimizadas para búsqueda.\n\nDevuelve el resultado ESTRICTAMENTE en formato JSON, usando esta estructura exacta (un array de objetos):\n[\n  {\n    "title": "Smartwatch Serie 8 [Título Atractivo]",\n    "price": 1500,\n    "description": "🔥 ¡OFERTA!\\n\\n✅ Beneficio 1...\\n\\n💬 ¡Escríbeme!",\n    "tags": ["smartwatch", "reloj", "oferta", "tecnologia", "barato", ...] // ¡Asegura 20 tags!\n  }\n]\nNO añadas texto adicional fuera del JSON.`
        : `Actúa como Copywriter Experto en Ventas para FB Marketplace. \nGenera una plantilla de venta independiente y optimizada para CADA UNO de los siguientes productos:\n${productPlaceholder}\n\nSigue estas reglas para cada producto:\n1. Título SEO atractivo.\n2. Descripción con viñetas (✅) beneficios y emojis.\n3. Llamado a la acción y estado del producto.\n4. Genera EXACTAMENTE 20 etiquetas (tags) optimizadas para búsqueda.\n\nDevuelve el resultado ESTRICTAMENTE en formato JSON, usando esta estructura exacta (un array de objetos, uno por producto):\n[\n  {\n    "title": "Nombre del Producto 1 [Título Atractivo]",\n    "price": 1500,\n    "description": "🔥 ¡OFERTA!\\n\\n✅ Beneficio 1...\\n\\n💬 ¡Escríbeme!",\n    "tags": ["producto1", "oferta", "tecnologia", "barato", ...] // ¡Asegura 20 tags!\n  }\n]\nNO añadas texto adicional fuera del JSON.`;

    const handleCopyPrompt = async () => {
        await navigator.clipboard.writeText(promptText);
        setCopiedPrompt(true);
        toast.success("Prompt copiado. Pégalo en Gemini.");
        setTimeout(() => setCopiedPrompt(false), 2000);
    };

    const handleParseJson = () => {
        if (!jsonText.trim()) return toast.error("Pega el texto de Gemini primero");
        
        try {
            const textToParse = jsonText.replace(/```json\n?/, '').replace(/```/, '').trim();
            const parsed = JSON.parse(textToParse);
            if (!Array.isArray(parsed)) throw new Error("Debe ser un array");
            
            // Add a temporary local state for individual images
            const listingsWithImages = parsed.map(p => ({
                ...p,
                image_urls: [] 
            }));
            setPreviewListings(listingsWithImages);
            toast.success(`${parsed.length} plantillas encontradas`);
        } catch (error) {
            console.error(error);
            toast.error("El formato de Gemini no es un JSON válido");
        }
    };

    const updateListingImage = (index: number, newUrls: string[]) => {
        const updated = [...previewListings];
        updated[index].image_urls = newUrls;
        setPreviewListings(updated);
    };

    const handleSaveAll = async () => {
        if (previewListings.length === 0) return;
        setIsSaving(true);
        try {
            // Generate a shared UUID if it's variations mode
            const sharedGroupId = batchType === 'variations' ? crypto.randomUUID() : undefined;

            const finalData = previewListings.map(listing => {
                const hasIndividualImages = listing.image_urls && listing.image_urls.length > 0;
                const finalUrls = hasIndividualImages ? listing.image_urls : imageUrls;

                return {
                    title: listing.title,
                    description: listing.description,
                    price: Number(listing.price) || 0,
                    tags: (listing.tags || []).slice(0, 20),
                    image_urls: finalUrls,
                    group_id: sharedGroupId,
                    skus: productSkus.length > 0 ? productSkus : undefined
                };
            });

            await onSave(finalData);
            onClose();
            toast.success(`¡${finalData.length} plantillas guardadas!`);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar las plantillas");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-black text-lg flex items-center gap-2">
                            <Sparkles size={20} /> Importación Masiva (IA)
                        </h3>
                        <p className="text-indigo-200 text-xs mt-1">Genera múltiples plantillas a la vez</p>
                    </div>
                    <button onClick={onClose} className="text-indigo-100 hover:text-white transition-colors bg-black/10 p-1.5 rounded-full">
                        <X size={16} />
                    </button>
                </div>
                
                <div className="p-5 overflow-y-auto flex-1 space-y-5">
                    {/* Modo de Importación */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 className="font-bold text-slate-800 text-sm mb-3">¿Qué deseas crear?</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setBatchType('variations')}
                                className={`text-left p-3 rounded-xl border-2 transition-all ${batchType === 'variations' ? 'border-indigo-500 bg-indigo-50' : 'border-transparent bg-white shadow-sm hover:border-slate-200'}`}
                            >
                                <p className={`font-bold text-sm ${batchType === 'variations' ? 'text-indigo-700' : 'text-slate-700'}`}>Variantes del Mismo Producto</p>
                                <p className="text-xs text-slate-500 mt-1">Crea 3 opciones de texto (oferta, directo, beneficios) para 1 solo producto. Se agruparán en pestañas.</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setBatchType('different_products')}
                                className={`text-left p-3 rounded-xl border-2 transition-all ${batchType === 'different_products' ? 'border-indigo-500 bg-indigo-50' : 'border-transparent bg-white shadow-sm hover:border-slate-200'}`}
                            >
                                <p className={`font-bold text-sm ${batchType === 'different_products' ? 'text-indigo-700' : 'text-slate-700'}`}>Diferentes Productos</p>
                                <p className="text-xs text-slate-500 mt-1">Crea 1 plantilla individual para cada producto de una lista. Se guardarán como tarjetas separadas.</p>
                            </button>
                        </div>
                    </div>

                    {/* Datos del Producto */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {batchType === 'variations' ? 'Nombre del Producto' : 'Lista de Productos'}
                                </label>
                                <input 
                                    type="text" 
                                    placeholder={batchType === 'variations' ? "Ej. iPhone 13 Pro Max" : "Ej. Audífonos, Reloj y Cable"}
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-1">
                                    Vincular con Inventario (Opcional)
                                    <div className="group relative">
                                        <Info size={14} className="text-slate-400 cursor-help" />
                                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg shadow-lg z-10 text-center">
                                            Escribe el SKU o Nombre exacto del producto en Kargo para rastrear el stock.
                                        </div>
                                    </div>
                                </label>
                                <ProductSelector
                                    values={productSkus}
                                    onChange={setProductSkus}
                                    disabled={batchType === 'different_products'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Prompt */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 w-5 h-5 flex items-center justify-center rounded-full text-xs">1</span> 
                            Instruye a la Inteligencia Artificial
                        </h4>
                        <p className="text-xs text-slate-500 mb-3">Copia el siguiente mensaje y pégalo en Gemini o ChatGPT.</p>
                        <button 
                            type="button"
                            onClick={handleCopyPrompt}
                            className="w-full bg-white border border-slate-300 text-slate-700 rounded-lg p-2.5 text-xs font-bold flex justify-center items-center gap-2 hover:bg-slate-100 transition-colors shadow-sm"
                        >
                            {copiedPrompt ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />} 
                            {copiedPrompt ? 'Copiado al portapapeles' : 'Copiar "Mega Prompt"'}
                        </button>
                    </div>

                    {/* Step 2: Shared Images */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 w-5 h-5 flex items-center justify-center rounded-full text-xs">2</span> 
                            Sube las Imágenes (Banco Compartido)
                        </h4>
                        <p className="text-xs text-slate-500 mb-3">Sube aquí las imágenes que se usarán en las publicaciones por defecto.</p>
                        <ImageUploader
                            images={imageUrls}
                            onChange={setImageUrls}
                            maxImages={10}
                        />
                    </div>

                    {/* Step 3: Paste JSON */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 w-5 h-5 flex items-center justify-center rounded-full text-xs">3</span> 
                            Pega la respuesta de la IA
                        </h4>
                        <textarea
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            placeholder='[ { "title": "...", "description": "..." } ]'
                            className="w-full h-32 border border-slate-300 rounded-lg p-3 text-xs font-mono outline-none focus:border-indigo-500 mb-3"
                        />
                        <button 
                            type="button"
                            onClick={handleParseJson}
                            className="w-full bg-indigo-600 text-white rounded-lg p-2.5 text-xs font-bold hover:bg-indigo-700 transition-colors"
                        >
                            Leer y Generar Plantillas
                        </button>
                    </div>

                    {/* Step 4: Preview */}
                    {previewListings.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-700 w-5 h-5 flex items-center justify-center rounded-full text-xs">4</span> 
                                Revisa y Guarda
                            </h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4">
                                {previewListings.map((listing, i) => (
                                    <div key={i} className="bg-white border border-slate-200 p-3 rounded-lg flex gap-3 shadow-sm">
                                        <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 relative group cursor-pointer">
                                            {listing.image_urls && listing.image_urls.length > 0 ? (
                                                <img src={listing.image_urls[0]} alt="Miniatura personalizada" className="w-full h-full object-cover" />
                                            ) : imageUrls.length > 0 ? (
                                                <img src={imageUrls[0]} alt="Miniatura" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] text-slate-400">Sin img</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-slate-800 truncate">{listing.title}</p>
                                            <p className="text-emerald-600 text-xs font-bold mb-1">RD$ {listing.price}</p>
                                            <p className="text-[10px] text-slate-500 truncate">{listing.tags?.length} etiquetas • {(listing.description || '').substring(0, 30)}...</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button 
                                type="button"
                                onClick={handleSaveAll}
                                disabled={isSaving}
                                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving ? 'Guardando...' : `Guardar ${previewListings.length} Plantillas`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

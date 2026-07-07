'use client';

import { useState } from 'react';
import { MarketplaceListing } from '../../types';
import { X, Save, Sparkles, Copy, Check, UploadCloud } from 'lucide-react';
import ImageUploader from '../products/ImageUploader';
import { toast } from 'sonner';

interface BatchImportModalProps {
    onClose: () => void;
    onSave: (data: Omit<MarketplaceListing, 'id' | 'user_id' | 'created_at'>[]) => Promise<void>;
}

export default function BatchImportModal({ onClose, onSave }: BatchImportModalProps) {
    const [jsonText, setJsonText] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [previewListings, setPreviewListings] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [productName, setProductName] = useState('');

    const productPlaceholder = productName.trim() || "[ESCRIBE TU PRODUCTO AQUÍ] (Añade detalles si tienes)";
    const promptText = `Actúa como Copywriter Experto en Ventas para FB Marketplace. 
Genera 3 variaciones de plantillas de ventas (oferta, beneficios, directa) para este producto: ${productPlaceholder}.

Sigue estas reglas para cada variación:
1. Título SEO atractivo.
2. Descripción con viñetas (✅) beneficios y emojis.
3. Llamado a la acción y estado del producto.
4. Genera EXACTAMENTE 20 etiquetas (tags) optimizadas para búsqueda.

Devuelve el resultado ESTRICTAMENTE en formato JSON, usando esta estructura exacta (un array de objetos):
[
  {
    "title": "Smartwatch Serie 8 [Título Atractivo]",
    "price": 1500,
    "description": "🔥 ¡OFERTA!\\n\\n✅ Beneficio 1...\\n\\n💬 ¡Escríbeme!",
    "tags": ["smartwatch", "reloj", "oferta", "tecnologia", "barato", ...] // ¡Asegura 20 tags!
  }
]
NO añadas texto adicional fuera del JSON.`;

    const handleCopyPrompt = async () => {
        await navigator.clipboard.writeText(promptText);
        setCopiedPrompt(true);
        toast.success("Prompt copiado. Pégalo en Gemini.");
        setTimeout(() => setCopiedPrompt(false), 2000);
    };

    const handleParseJson = () => {
        if (!jsonText.trim()) return toast.error("Pega el texto de Gemini primero");
        
        try {
            // Find JSON array in the text in case there is some markdown wrapping it like ```json ... ```
            const jsonMatch = jsonText.match(/\[\s*\{[\s\S]*\}\s*\]/);
            const textToParse = jsonMatch ? jsonMatch[0] : jsonText;

            const parsed = JSON.parse(textToParse);
            if (!Array.isArray(parsed)) throw new Error("Not an array");
            
            // Validate and clean each object
            const cleaned = parsed.map(item => ({
                title: item.title || 'Sin Título',
                price: Number(item.price) || 0,
                description: item.description || '',
                tags: Array.isArray(item.tags) ? item.tags : (item.tags || '').toString().split(',').map((t: string) => t.trim())
            }));

            setPreviewListings(cleaned);
            toast.success(`¡Se detectaron ${cleaned.length} plantillas!`);
        } catch(e) {
            console.error(e);
            toast.error("Error al leer el texto. Asegúrate de que es un JSON válido.");
        }
    };

    const handleSaveAll = async () => {
        if (previewListings.length === 0) return toast.error("No hay plantillas para guardar");
        
        setIsSaving(true);
        try {
            // Attach images to all listings
            const finalData = previewListings.map(listing => {
                // If they explicitly selected or uploaded individual images, use ONLY those.
                // If they didn't touch it, fallback to ALL shared imageUrls.
                const hasIndividualImages = listing.image_urls && listing.image_urls.length > 0;
                const finalUrls = hasIndividualImages ? listing.image_urls : imageUrls;

                return {
                    ...listing,
                    image_urls: finalUrls,
                    // Ensure tags are limited to 20
                    tags: listing.tags.slice(0, 20)
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
                        <p className="text-indigo-200 text-xs mt-1">Crea docenas de versiones en segundos</p>
                    </div>
                    <button onClick={onClose} className="text-indigo-100 hover:text-white transition-colors bg-black/10 p-1.5 rounded-full">
                        <X size={16} />
                    </button>
                </div>
                
                <div className="p-5 overflow-y-auto flex-1 space-y-5">
                    {/* Step 1: Prompt */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 w-5 h-5 flex items-center justify-center rounded-full text-xs">1</span> 
                            Instruye a la Inteligencia Artificial
                        </h4>
                        <p className="text-xs text-slate-500 mb-3">Opcional: Escribe el producto para que el prompt ya lo incluya. Luego cópialo y pégalo en Gemini o ChatGPT.</p>
                        <input 
                            type="text" 
                            placeholder="Ej. iPhone 13 Pro Max 128GB"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs mb-3 outline-none focus:border-indigo-500"
                        />
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
                            Imágenes Compartidas
                        </h4>
                        <p className="text-xs text-slate-500 mb-3">Sube las fotos de tu producto. Todas las plantillas importadas usarán estas mismas fotos.</p>
                        <ImageUploader 
                            images={imageUrls} 
                            setImages={setImageUrls} 
                            productId={'marketplace_batch_temp'} 
                        />
                    </div>

                    {/* Step 3: Parse JSON */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 w-5 h-5 flex items-center justify-center rounded-full text-xs">3</span> 
                            Pega la Respuesta (JSON)
                        </h4>
                        <textarea 
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 h-28 font-mono bg-white shadow-inner"
                            placeholder='[&#10;  {&#10;    "title": "...",&#10;    "price": 1500,&#10;    ...&#10;  }&#10;]'
                        />
                        <button 
                            type="button"
                            onClick={handleParseJson}
                            className="w-full mt-3 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg p-2.5 text-xs font-bold flex justify-center items-center gap-2 hover:bg-indigo-200 transition-colors"
                        >
                            <Sparkles size={14} /> Analizar y Previsualizar
                        </button>
                    </div>

                    {/* Step 4: Preview & Save */}
                    {previewListings.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-in slide-in-from-bottom-2">
                            <h4 className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2">
                                <Check size={16} /> ¡Todo listo! Se detectaron {previewListings.length} plantillas:
                            </h4>
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-4">
                                {previewListings.map((item, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm flex flex-col gap-2">
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{item.title}</div>
                                            <div className="text-emerald-600 font-bold text-xs">RD$ {item.price.toLocaleString()}</div>
                                            <div className="text-slate-500 mt-0.5 text-[10px] truncate">{item.tags.join(', ')}</div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100">
                                            <p className="text-[10px] text-slate-500 font-bold mb-1">Imágenes de esta publicación (Opcional)</p>
                                            
                                            {imageUrls.length > 0 && (
                                                <div className="mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    <p className="text-[10px] text-slate-500 font-bold mb-1">Elegir del banco compartido:</p>
                                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                                        {imageUrls.map((url, i) => {
                                                            const isSelected = (item.image_urls || []).includes(url);
                                                            return (
                                                                <img 
                                                                    key={i} 
                                                                    src={url} 
                                                                    alt="shared" 
                                                                    onClick={() => {
                                                                        const updated = [...previewListings];
                                                                        const currentUrls = updated[idx].image_urls || [];
                                                                        if (isSelected) {
                                                                            updated[idx].image_urls = currentUrls.filter((u: string) => u !== url);
                                                                        } else {
                                                                            updated[idx].image_urls = [...currentUrls, url];
                                                                        }
                                                                        setPreviewListings(updated);
                                                                    }}
                                                                    className={`w-12 h-12 object-cover rounded cursor-pointer transition-all shrink-0 ${isSelected ? 'ring-2 ring-indigo-500 opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                                                />
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <ImageUploader 
                                                images={item.image_urls || []} 
                                                setImages={(urls) => {
                                                    const updated = [...previewListings];
                                                    updated[idx].image_urls = urls;
                                                    setPreviewListings(updated);
                                                }} 
                                                productId={`marketplace_batch_item_${idx}`} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={handleSaveAll}
                                disabled={isSaving}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-black py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <UploadCloud size={18} />
                                {isSaving ? 'Guardando...' : `Guardar las ${previewListings.length} Plantillas`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

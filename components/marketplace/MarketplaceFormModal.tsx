'use client';

import { useState } from 'react';
import { MarketplaceListing } from '../../types';
import { X, Save, Tags, Sparkles, Copy, ChevronDown, Check } from 'lucide-react';
import ImageUploader from '../products/ImageUploader';
import { toast } from 'sonner';

interface MarketplaceFormModalProps {
    initialData?: MarketplaceListing;
    onClose: () => void;
    onSave: (data: Omit<MarketplaceListing, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
}

export default function MarketplaceFormModal({ initialData, onClose, onSave }: MarketplaceFormModalProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [price, setPrice] = useState<number>(initialData?.price || 0);
    const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(' ') || '');
    const [imageUrls, setImageUrls] = useState<string[]>(initialData?.image_urls || []);
    const [isSaving, setIsSaving] = useState(false);

    // AI Import State
    const [showAiImport, setShowAiImport] = useState(false);
    const [aiText, setAiText] = useState('');
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [productName, setProductName] = useState('');

    const productPlaceholder = productName.trim() || "[ESCRIBE EL PRODUCTO AQUÍ] (Añade detalles si los tienes)";
    const aiPrompt = `Actúa como un Copywriter Experto en Ventas para Facebook Marketplace. 
Crea la publicación perfecta para vender este producto: ${productPlaceholder}.

Sigue estas reglas de SEO y conversión:
- Título atractivo con palabras clave reales.
- Descripción con beneficios claros, estructurada con viñetas (✅) y emojis llamativos.
- Incluye condiciones de entrega, estado del producto y llamado a la acción.

Usa EXACTAMENTE este formato estricto de respuesta (sin añadir nada más):
TITULO: [Título SEO]
PRECIO: [Solo el número]
DESCRIPCION: [Descripción persuasiva y estructurada]
ETIQUETAS: tag1, tag2, tag3 (hasta 20)`;

    const handleCopyPrompt = async () => {
        await navigator.clipboard.writeText(aiPrompt);
        setCopiedPrompt(true);
        toast.success("Prompt copiado. Pégalo en Gemini.");
        setTimeout(() => setCopiedPrompt(false), 2000);
    };

    const handleParseAi = () => {
        if (!aiText.trim()) return toast.error("Pega el texto de Gemini primero");
        try {
            const titleMatch = aiText.match(/TITULO:\s*(.+)/i);
            const priceMatch = aiText.match(/PRECIO:\s*([\d,.]+)/i);
            const descMatch = aiText.match(/DESCRIPCION:\s*([\s\S]*?)(?:ETIQUETAS:|$)/i);
            const tagsMatch = aiText.match(/ETIQUETAS:\s*(.+)/i);

            if (titleMatch) setTitle(titleMatch[1].trim());
            if (priceMatch) setPrice(Number(priceMatch[1].replace(/,/g, '')));
            if (descMatch) setDescription(descMatch[1].trim());
            if (tagsMatch) setTagsInput(tagsMatch[1].trim());

            toast.success("¡Datos extraídos con éxito! 🪄");
            setShowAiImport(false);
            setAiText('');
        } catch(e) {
            toast.error("Error al leer el texto. Asegúrate de usar el formato correcto.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Parse tags
        const tags = tagsInput
            .split(/[\s,]+/)
            .map(t => t.trim().replace(/^#/, ''))
            .filter(t => t.length > 0)
            .slice(0, 20); // Limit to 20 tags

        if (!title.trim()) return toast.error("El título es requerido");
        
        setIsSaving(true);
        try {
            await onSave({
                title: title.trim(),
                description: description.trim(),
                price,
                tags,
                image_urls: imageUrls
            });
            onClose();
            toast.success("Plantilla guardada");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la plantilla");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="bg-blue-600 p-4 text-white flex justify-between items-center shrink-0">
                    <h3 className="font-black text-lg flex items-center gap-2">
                        {initialData ? 'Editar Plantilla' : 'Nueva Plantilla'}
                    </h3>
                    <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors bg-black/10 p-1.5 rounded-full">
                        <X size={16} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1">
                    <div className="space-y-4">
                        {/* AI Import Section */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 overflow-hidden">
                            <button 
                                type="button"
                                onClick={() => setShowAiImport(!showAiImport)}
                                className="w-full flex items-center justify-between p-3 text-indigo-700 font-bold text-sm"
                            >
                                <span className="flex items-center gap-2"><Sparkles size={16} /> Rellenar con Inteligencia Artificial (Gemini)</span>
                                <ChevronDown size={16} className={`transition-transform ${showAiImport ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showAiImport && (
                                <div className="p-3 pt-0 border-t border-indigo-100/50 space-y-3">
                                    <p className="text-xs text-indigo-900/70">1. Opcional: Escribe el producto para incluirlo en el prompt. Luego cópialo y pégalo en Gemini o ChatGPT.</p>
                                    <input 
                                        type="text" 
                                        placeholder="Ej. Samsung S23 Ultra 256GB"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        className="w-full border border-indigo-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 bg-white"
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleCopyPrompt}
                                        className="w-full bg-white border border-indigo-200 text-indigo-600 rounded-lg p-2 text-xs font-bold flex justify-center items-center gap-2 hover:bg-indigo-50 transition-colors"
                                    >
                                        {copiedPrompt ? <Check size={14} /> : <Copy size={14} />} {copiedPrompt ? 'Copiado al portapapeles' : 'Copiar Prompt para la IA'}
                                    </button>
                                    
                                    <p className="text-xs text-indigo-900/70 mt-3">2. Pega la respuesta de la IA aquí abajo:</p>
                                    <textarea 
                                        value={aiText}
                                        onChange={(e) => setAiText(e.target.value)}
                                        className="w-full border border-indigo-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-400 h-24 resize-none bg-white/50"
                                        placeholder="TITULO: ...&#10;PRECIO: ...&#10;DESCRIPCION: ..."
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleParseAi}
                                        className="w-full bg-indigo-600 text-white rounded-lg p-2 text-xs font-bold flex justify-center items-center gap-2 hover:bg-indigo-700 transition-colors"
                                    >
                                        <Sparkles size={14} /> Extraer Datos y Rellenar Formulario
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Images */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Fotos del Producto</label>
                            <ImageUploader 
                                images={imageUrls} 
                                setImages={setImageUrls} 
                                productId={initialData?.id || 'marketplace_temp'} 
                            />
                        </div>

                        {/* Title & Price */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Título</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Ej. Reloj Inteligente Serie 8..."
                                    required
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Precio (RD$)</label>
                                <input 
                                    type="number" 
                                    value={price || ''}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Descripción para Facebook</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 transition-colors h-32 resize-none"
                                placeholder="Condición: Nuevo&#10;Entrega disponible en..."
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
                                <Tags size={12} /> Etiquetas (Hasta 20)
                            </label>
                            <textarea 
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 transition-colors h-16 resize-none font-mono text-xs bg-slate-50"
                                placeholder="tecnologia, smartwatch, reloj, oferta..."
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Separa las palabras con espacios o comas. Se añadirán los # automáticamente.</p>
                        </div>
                    </div>
                </form>

                <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                    <button 
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-black py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
                    </button>
                </div>
            </div>
        </div>
    );
}

import { MarketplaceListing } from '../../types';
import { Copy, Trash2, Edit, Download, Check, CopyPlus, Package, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useProducts } from '../../hooks/useProducts';

interface MarketplaceCardProps {
    listings: MarketplaceListing[]; // Array of variations
    onEdit: (listing: MarketplaceListing) => void;
    onDelete: (id: string) => void;
    onDuplicate?: (listing: MarketplaceListing) => void;
}

export default function MarketplaceCard({ listings, onEdit, onDelete, onDuplicate }: MarketplaceCardProps) {
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    // Safety check in case a listing is deleted and index is out of bounds
    const activeListing = listings[activeTabIndex] || listings[0];
    
    // Copy states
    const [copiedTitle, setCopiedTitle] = useState(false);
    const [copiedPrice, setCopiedPrice] = useState(false);
    const [copiedDesc, setCopiedDesc] = useState(false);
    const [copiedTags, setCopiedTags] = useState(false);

    // Fetch products to check stock based on SKU
    const { data: allProducts } = useProducts();
    const [stockCount, setStockCount] = useState<number | null>(null);

    useEffect(() => {
        if (activeListing && activeListing.sku && allProducts) {
            const inStock = allProducts.filter(p => 
                (p.sku === activeListing.sku || p.name === activeListing.sku) && 
                p.status === 'RECEIVED'
            );
            setStockCount(inStock.length);
        } else {
            setStockCount(null);
        }
    }, [activeListing?.sku, allProducts]);

    const copyText = async (text: string, setter: (val: boolean) => void, msg: string) => {
        await navigator.clipboard.writeText(text);
        setter(true);
        toast.success(msg);
        setTimeout(() => setter(false), 2000);
    };

    const handleDownloadImage = async (url: string) => {
        if (!activeListing) return;
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `fb_market_${activeListing.title.replace(/\s+/g, '_')}.jpg`;
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            toast.success("Imagen descargada");
        } catch (error) {
            toast.error("No se pudo descargar la imagen");
        }
    };

    if (!activeListing) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mb-4">
            {/* Tabs for Multiple Variations */}
            {listings.length > 1 && (
                <div className="flex overflow-x-auto bg-slate-50 border-b border-slate-200 scrollbar-hide p-1 gap-1">
                    {listings.map((l, idx) => (
                        <button
                            key={l.id}
                            onClick={() => setActiveTabIndex(idx)}
                            className={`px-4 py-2 text-xs font-bold whitespace-nowrap rounded-lg transition-colors ${
                                activeTabIndex === idx 
                                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' 
                                : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700 border border-transparent'
                            }`}
                        >
                            Variante {idx + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* Image Section */}
            {activeListing.image_urls && activeListing.image_urls.length > 0 && (
                <div className="relative h-48 bg-slate-100 border-b border-slate-100 group flex items-center justify-center p-2">
                    <img src={activeListing.image_urls[0]} alt={activeListing.title} className="max-w-full max-h-full object-contain rounded-lg" />
                    <button 
                        onClick={() => handleDownloadImage(activeListing.image_urls[0])}
                        className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Descargar Imagen Principal"
                    >
                        <Download size={16} />
                    </button>
                </div>
            )}

            <div className="p-4">
                {/* Stock Indicator */}
                {stockCount !== null && (
                    <div className={`mb-3 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 w-fit rounded-full ${stockCount > 0 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {stockCount > 0 ? <Package size={14} /> : <AlertCircle size={14} />}
                        {stockCount > 0 ? `${stockCount} en Stock` : 'Agotado - Pausar en FB'}
                    </div>
                )}

                <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-800 text-lg leading-tight">{activeListing.title}</h3>
                            <button onClick={() => copyText(activeListing.title, setCopiedTitle, "Título copiado")} className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-md border border-slate-200 transition-colors shadow-sm">
                                {copiedTitle ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <p className="text-emerald-600 font-bold text-base">RD$ {activeListing.price.toLocaleString()}</p>
                            <button onClick={() => copyText(activeListing.price.toString(), setCopiedPrice, "Precio copiado")} className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-md border border-slate-200 transition-colors shadow-sm">
                                {copiedPrice ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex gap-1">
                            {onDuplicate && (
                                <button onClick={() => onDuplicate(activeListing)} title="Duplicar" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><CopyPlus size={14} /></button>
                            )}
                            <button onClick={() => onEdit(activeListing)} title="Editar" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14} /></button>
                            <button onClick={() => onDelete(activeListing.id)} title="Eliminar" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </div>
                    </div>
                </div>
                
                {/* Description with Copy */}
                <div className="mt-4 relative group">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción</p>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto pr-10">
                        {activeListing.description || "Sin descripción..."}
                    </div>
                    <button 
                        onClick={() => copyText(activeListing.description, setCopiedDesc, "Descripción copiada")}
                        className="absolute top-5 right-2 p-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Copiar Descripción"
                    >
                        {copiedDesc ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                </div>

                {/* Tags with Copy */}
                <div className="mt-4 relative pr-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Etiquetas</p>
                    <div className="flex flex-wrap gap-1.5">
                        {(activeListing.tags || []).map((tag, i) => (
                            <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium border border-indigo-100/50">
                                {tag.startsWith('#') ? tag : `#${tag}`}
                            </span>
                        ))}
                    </div>
                    {(activeListing.tags && activeListing.tags.length > 0) && (
                        <button 
                            onClick={() => copyText(activeListing.tags.map(t => t.startsWith('#') ? t : `#${t}`).join(' '), setCopiedTags, "Etiquetas copiadas")}
                            className="absolute top-5 right-0 p-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-slate-500 hover:text-indigo-600 transition-colors"
                            title="Copiar Etiquetas"
                        >
                            {copiedTags ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

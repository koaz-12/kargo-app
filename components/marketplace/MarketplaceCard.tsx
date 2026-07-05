import { MarketplaceListing } from '../../types';
import { Copy, Trash2, Edit, Download, Check, Tags, CopyPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface MarketplaceCardProps {
    listing: MarketplaceListing;
    onEdit: (listing: MarketplaceListing) => void;
    onDelete: (id: string) => void;
    onDuplicate?: (listing: MarketplaceListing) => void;
}

export default function MarketplaceCard({ listing, onEdit, onDelete, onDuplicate }: MarketplaceCardProps) {
    const [copiedDesc, setCopiedDesc] = useState(false);
    const [copiedTags, setCopiedTags] = useState(false);

    const handleCopyDescription = async () => {
        const text = `${listing.title}\n\nPrecio: RD$ ${listing.price.toLocaleString()}\n\n${listing.description}`;
        await navigator.clipboard.writeText(text);
        setCopiedDesc(true);
        toast.success("Descripción copiada al portapapeles");
        setTimeout(() => setCopiedDesc(false), 2000);
    };

    const handleCopyTags = async () => {
        if (!listing.tags || listing.tags.length === 0) return toast.info("No hay etiquetas");
        const text = listing.tags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ');
        await navigator.clipboard.writeText(text);
        setCopiedTags(true);
        toast.success("Etiquetas copiadas al portapapeles");
        setTimeout(() => setCopiedTags(false), 2000);
    };

    const handleDownloadImage = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `fb_market_${listing.title.replace(/\s+/g, '_')}.jpg`;
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            toast.success("Imagen descargada");
        } catch (error) {
            toast.error("No se pudo descargar la imagen");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col mb-4">
            {/* Image Section */}
            {listing.image_urls && listing.image_urls.length > 0 && (
                <div className="relative h-48 bg-slate-100 border-b border-slate-100 group">
                    <img src={listing.image_urls[0]} alt={listing.title} className="w-full h-full object-contain" />
                    <button 
                        onClick={() => handleDownloadImage(listing.image_urls[0])}
                        className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Descargar Imagen Principal"
                    >
                        <Download size={16} />
                    </button>
                </div>
            )}

            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-slate-800 text-lg leading-tight">{listing.title}</h3>
                    <div className="flex items-center gap-1">
                        {onDuplicate && (
                            <button onClick={() => onDuplicate(listing)} title="Duplicar Plantilla" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><CopyPlus size={14} /></button>
                        )}
                        <button onClick={() => onEdit(listing)} title="Editar Plantilla" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14} /></button>
                        <button onClick={() => onDelete(listing.id)} title="Eliminar" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                </div>
                <p className="text-emerald-600 font-bold mb-3">RD$ {listing.price.toLocaleString()}</p>
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 text-xs text-slate-600 whitespace-pre-wrap">
                    {listing.description || "Sin descripción..."}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {(listing.tags || []).slice(0, 5).map((tag, i) => (
                        <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                            {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                    ))}
                    {(listing.tags && listing.tags.length > 5) && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">+{listing.tags.length - 5} más</span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                    <button 
                        onClick={handleCopyDescription}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition-colors border ${copiedDesc ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                    >
                        {copiedDesc ? <Check size={14} /> : <Copy size={14} />} 
                        {copiedDesc ? '¡Copiado!' : 'Copiar Texto'}
                    </button>
                    <button 
                        onClick={handleCopyTags}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition-colors border ${copiedTags ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'}`}
                    >
                        {copiedTags ? <Check size={14} /> : <Tags size={14} />} 
                        {copiedTags ? '¡Copiado!' : 'Copiar Tags'}
                    </button>
                </div>
            </div>
        </div>
    );
}

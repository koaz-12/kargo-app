import React from 'react';
import { Copy, Package, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ShipmentTracking } from '../../types/shipment';

interface TrackerItemProps {
    tracking: ShipmentTracking;
    onEdit: (tracking: ShipmentTracking) => void;
    onDelete: (id: string) => void;
}

export const TrackerItem: React.FC<TrackerItemProps> = ({ tracking, onEdit, onDelete }) => {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copiado al portapapeles');
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start justify-between hover:bg-slate-100 transition-colors">
            <div className="flex-1 min-w-0">
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        {tracking.courier === 'Tienda' ? (
                            <span title="Tracking USA/Tienda" className="text-xs opacity-70">🇺🇸</span>
                        ) : (
                            <span title="Tracking Local (RD)" className="text-xs opacity-70">🇩🇴</span>
                        )}
                        {tracking.tracking_number}
                        <button
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            onClick={() => copyToClipboard(tracking.tracking_number)}
                        >
                            <Copy size={12} />
                        </button>
                    </span>

                    {tracking.store_tracking && (
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1 rounded w-fit flex items-center gap-1 mt-0.5">
                            <span className="opacity-50">🇺🇸</span>
                            USA: {tracking.store_tracking}
                            <button
                                className="text-slate-400 hover:text-blue-600 transition-colors ml-1"
                                onClick={() => copyToClipboard(tracking.store_tracking!)}
                            >
                                <Copy size={10} />
                            </button>
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 mb-1 flex-wrap mt-1">
                    {tracking.is_from_inventory && (
                        <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase animate-pulse shrink-0">
                            Inventario
                        </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${tracking.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                        tracking.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' :
                            tracking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                'bg-slate-200 text-slate-600'
                        }`}>
                        {tracking.status === 'PENDING' ? 'Pendiente' :
                            tracking.status === 'IN_TRANSIT' ? 'En Tránsito' :
                                tracking.status === 'DELIVERED' ? 'Recibido' : 'Cancelado'}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${tracking.tracking_type === 'BUSINESS'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-emerald-50 text-emerald-700'
                        }`}>
                        {tracking.tracking_type === 'BUSINESS' ? '💼' : '👤'}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <span className="font-bold text-slate-700">{tracking.courier}</span>
                    {tracking.weight_lb && (
                        <>
                            <span>•</span>
                            <span className="text-blue-600 bg-blue-50 px-1 rounded">{tracking.weight_lb} lbs</span>
                        </>
                    )}
                </div>
                {tracking.notes && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">{tracking.notes}</p>
                )}

                {tracking.associated_products && tracking.associated_products.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {tracking.associated_products.map(p => (
                            <span key={p.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 shadow-sm">
                                <Package size={10} />
                                {p.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1 items-end">
                {!tracking.is_from_inventory && (
                    <div className="flex gap-1">
                        <button
                            onClick={() => onEdit(tracking)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                            title="Editar"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button
                            onClick={() => onDelete(tracking.id)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition-colors ml-2"
                            title="Eliminar"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
                <span className="text-[10px] text-slate-400 font-mono text-right mt-1">
                    {new Date(tracking.created_at).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
};

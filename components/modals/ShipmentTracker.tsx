'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Package, Loader2, Trash2, Briefcase, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import type { ShipmentTracking } from '../../types/shipment';
import { detectCourier, COURIER_OPTIONS } from '../../utils/courierDetection';

interface ShipmentTrackerProps {
    onClose: () => void;
}

export const ShipmentTracker: React.FC<ShipmentTrackerProps> = ({ onClose }) => {
    const [trackings, setTrackings] = useState<ShipmentTracking[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Courier Presets
    const [courierOptions, setCourierOptions] = useState<string[]>(COURIER_OPTIONS);
    const [defaultCourier, setDefaultCourier] = useState('Pintopack');

    // Form state
    const [trackingNumber, setTrackingNumber] = useState('');
    const [storeTracking, setStoreTracking] = useState('');
    const [courier, setCourier] = useState('Pintopack');
    const [weightKg, setWeightKg] = useState('');
    const [weightLb, setWeightLb] = useState('');
    const [notes, setNotes] = useState('');
    const [trackingType, setTrackingType] = useState<'PERSONAL' | 'BUSINESS'>('BUSINESS');

    // Pagination for trackings list
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8; // Aumentado para ver más de un vistazo

    // Load courier presets and trackings
    useEffect(() => {
        loadCourierPresets();
        loadTrackings();
    }, []);

    const loadCourierPresets = async () => {
        try {
            const { data, error } = await supabase
                .from('courier_presets')
                .select('*')
                .order('display_order');

            if (error) throw error;

            if (data && data.length > 0) {
                // Use user's configured couriers
                const userCouriers = data.map(c => c.name);
                setCourierOptions(userCouriers);

                // Set default courier
                const defaultCourierItem = data.find(c => c.is_default);
                const defaultName = defaultCourierItem?.name || userCouriers[0];
                setDefaultCourier(defaultName);
                setCourier(defaultName);
            }
        } catch (error) {
            console.error('Error loading courier presets:', error);
            // Fallback to default COURIER_OPTIONS from utils
        }
    };

    const loadTrackings = async () => {
        try {
            const { data, error } = await supabase
                .from('shipment_tracking')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTrackings(data || []);
        } catch (error) {
            console.error('Error loading trackings:', error);
            toast.error('Error al cargar trackings');
        } finally {
            setLoading(false);
        }
    };

    // Auto-detect courier when tracking number changes
    const handleTrackingNumberChange = (value: string) => {
        setTrackingNumber(value);

        // Auto-detect courier
        if (value.trim()) {
            const detectedCourier = detectCourier(value);
            if (detectedCourier && detectedCourier !== 'Otro') {
                setCourier(detectedCourier);
            }
        }
    };

    const handleKgChange = (value: string) => {
        setWeightKg(value);
        if (value) {
            const kg = parseFloat(value);
            setWeightLb((kg * 2.20462).toFixed(2));
        } else {
            setWeightLb('');
        }
    };

    const handleLbChange = (value: string) => {
        setWeightLb(value);
        if (value) {
            const lb = parseFloat(value);
            setWeightKg((lb / 2.20462).toFixed(2));
        } else {
            setWeightKg('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!trackingNumber.trim()) {
            toast.error('El número de tracking es requerido');
            return;
        }

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            const { error } = await supabase.from('shipment_tracking').insert({
                user_id: user.id,
                tracking_number: trackingNumber.trim(),
                store_tracking: storeTracking.trim() || null,
                courier: courier.trim(),
                weight_kg: weightKg ? parseFloat(weightKg) : null,
                weight_lb: weightLb ? parseFloat(weightLb) : null,
                notes: notes.trim() || null,
                status: 'PENDING',
                tracking_type: trackingType
            });

            if (error) throw error;

            toast.success('Tracking guardado');

            // Reset form
            setTrackingNumber('');
            setStoreTracking('');
            setCourier(defaultCourier);
            setWeightKg('');
            setWeightLb('');
            setNotes('');
            setTrackingType('BUSINESS');

            // Reload list
            await loadTrackings();
        } catch (error) {
            console.error('Error saving tracking:', error);
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este tracking?')) return;

        try {
            const { error } = await supabase
                .from('shipment_tracking')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Tracking eliminado');
            await loadTrackings();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar');
        }
    };

    // Pagination
    const paginatedTrackings = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return trackings.slice(start, start + ITEMS_PER_PAGE);
    }, [trackings, currentPage]);

    const totalPages = Math.ceil(trackings.length / ITEMS_PER_PAGE);

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header - Optimized for Mobile */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <Package className="text-white" size={20} />
                        <h2 className="text-base font-bold text-white">Tracker de Envíos</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-white/20 transition-colors active:scale-95"
                    >
                        <X className="text-white" size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3">
                    {/* Form - Mobile Optimized */}
                    <form onSubmit={handleSubmit} className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {/* Tracking Type Selector */}
                        <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">
                                Tipo de Envío
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTrackingType('BUSINESS')}
                                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-sm transition-all ${trackingType === 'BUSINESS'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white text-slate-600 border border-slate-200'
                                        }`}
                                >
                                    <Briefcase size={16} />
                                    Negocio
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTrackingType('PERSONAL')}
                                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-sm transition-all ${trackingType === 'PERSONAL'
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-white text-slate-600 border border-slate-200'
                                        }`}
                                >
                                    <User size={16} />
                                    Personal
                                </button>
                            </div>
                        </div>

                        {/* Tracking Numbers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wider">
                                    Tracking Courier RD *
                                </label>
                                <input
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => handleTrackingNumberChange(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="PP-12345 o TEMU-DO..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wider">
                                    Tracking Tienda / USA
                                </label>
                                <input
                                    type="text"
                                    value={storeTracking}
                                    onChange={(e) => setStoreTracking(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="1Z999... o TBA..."
                                />
                            </div>
                        </div>

                        {/* Courier Selector */}
                        <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">
                                Courier
                            </label>
                            <select
                                value={courier}
                                onChange={(e) => setCourier(e.target.value)}
                                className="w-full px-3 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {courierOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Weight Inputs - Side by Side */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">
                                    Peso (KG)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={weightKg}
                                    onChange={(e) => handleKgChange(e.target.value)}
                                    className="w-full px-3 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="2.5"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">
                                    Peso (LB)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={weightLb}
                                    onChange={(e) => handleLbChange(e.target.value)}
                                    className="w-full px-3 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="5.51"
                                />
                            </div>
                        </div>

                        {/* Notes - Compact */}
                        <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">
                                Notas
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                rows={2}
                                placeholder="Información adicional..."
                            />
                        </div>

                        {/* Submit Button - Larger for Mobile */}
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 active:scale-95"
                        >
                            {saving && <Loader2 size={18} className="animate-spin" />}
                            {saving ? 'Guardando...' : 'Guardar Tracking'}
                        </button>
                    </form>

                    {/* Saved Trackings List with Pagination */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-700">
                                Trackings Guardados ({trackings.length})
                            </h3>
                            {totalPages > 1 && (
                                <span className="text-xs text-slate-500">
                                    Pág. {currentPage} de {totalPages}
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={24} className="animate-spin text-slate-400" />
                            </div>
                        ) : trackings.length === 0 ? (
                            <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 rounded-xl">
                                No hay trackings guardados
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    {paginatedTrackings.map((tracking) => (
                                        <div
                                            key={tracking.id}
                                            className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start justify-between hover:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="text-sm font-bold text-slate-800 truncate">
                                                        {tracking.tracking_number}
                                                    </span>
                                                    {tracking.store_tracking && (
                                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                                                            USA: {tracking.store_tracking}
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
                                            </div>
                                            <button
                                                onClick={() => handleDelete(tracking.id)}
                                                className="p-2 hover:bg-red-100 rounded-lg transition-colors ml-2 flex-shrink-0"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} className="text-red-600" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-3">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <span className="text-sm text-slate-600 font-medium min-w-[60px] text-center">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

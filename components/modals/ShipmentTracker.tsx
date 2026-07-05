'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Package, Loader2, Trash2, Briefcase, User, ChevronLeft, ChevronRight, Copy, Search, ScanBarcode } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import type { ShipmentTracking } from '../../types/shipment';
import { detectCourier, COURIER_OPTIONS } from '../../utils/courierDetection';
import { BarcodeScanner } from '../ui/BarcodeScanner';
import { ConfirmModal } from '../ui/ConfirmModal';

interface ShipmentTrackerProps {
    onClose: () => void;
}

export const ShipmentTracker: React.FC<ShipmentTrackerProps> = ({ onClose }) => {
    const [trackings, setTrackings] = useState<ShipmentTracking[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const [targetScan, setTargetScan] = useState<'MAIN' | 'STORE' | 'SEARCH'>('MAIN');

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
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'BUSINESS' | 'PERSONAL'>('ALL');

    // Pagination for trackings list
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8; // Aumentado para ver más de un vistazo
    
    // Delete Confirmation
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copiado al portapapeles');
    };

    const loadTrackings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Manual Trackings
            const { data: manualData, error: manualError } = await supabase
                .from('shipment_tracking')
                .select('*')
                .order('created_at', { ascending: false });

            if (manualError) throw manualError;

            // 2. Fetch Products with Tracking Numbers
            const { data: rawProducts, error: productsError } = await supabase
                .from('products')
                .select('id, name, tracking_number, courier_tracking, status, created_at')
                .order('created_at', { ascending: false });

            if (productsError) throw productsError;

            // Filter client-side to avoid complex PostgREST syntax errors with nulls/empty strings
            const productsData = (rawProducts || []).filter(p =>
                (p.tracking_number && p.tracking_number.trim().length > 0) ||
                (p.courier_tracking && p.courier_tracking.trim().length > 0)
            );

            // 3. Create "Virtual" Trackings (Grouped by Tracking Number)
            const manualTrackingNums = new Set(manualData?.map(t => t.tracking_number) || []);
            const manualStoreNums = new Set(manualData?.map(t => t.store_tracking) || []);
            const virtualGroups = new Map<string, ShipmentTracking>();

            productsData.forEach(p => {
                const trackingNum = p.courier_tracking || p.tracking_number;
                if (!trackingNum) return;

                // Skip if already exists as a manual tracking
                const hasManualTracking = p.courier_tracking && manualTrackingNums.has(p.courier_tracking);
                const hasManualStore = p.tracking_number && manualStoreNums.has(p.tracking_number);

                if (hasManualTracking || hasManualStore) return;

                // Group by the tracking number
                if (!virtualGroups.has(trackingNum)) {
                    virtualGroups.set(trackingNum, {
                        id: `prod-group-${trackingNum}`, // Unique ID based on tracking
                        user_id: user.id,
                        tracking_number: trackingNum,
                        store_tracking: p.courier_tracking ? p.tracking_number : undefined,
                        courier: p.courier_tracking ? detectCourier(p.courier_tracking) : 'Tienda',
                        weight_kg: undefined,
                        weight_lb: undefined,
                        notes: 'Agrupado desde Inventario',
                        status: p.status === 'RECEIVED' ? 'DELIVERED' :
                            p.status === 'SOLD' ? 'DELIVERED' : 'PENDING',
                        tracking_type: 'BUSINESS',
                        created_at: p.created_at,
                        updated_at: p.created_at,
                        associated_products: [],
                        is_from_inventory: true
                    });
                }

                // Add product to the group's associated list
                const group = virtualGroups.get(trackingNum)!;
                group.associated_products?.push({ id: p.id, name: p.name });

                // Update status if any item is pending, group is pending (conservative approach) or use latest
                // Here we keep the first one found or logic can be improved. 
                // Let's assume if one is pending, the package is pending.
                if (p.status !== 'RECEIVED' && p.status !== 'SOLD' && group.status === 'DELIVERED') {
                    group.status = 'PENDING';
                }
            });

            const virtualTrackings = Array.from(virtualGroups.values());

            // 4. Enrich Manual Trackings with Associated Products
            const manualWithProducts: ShipmentTracking[] = (manualData || []).map(tracking => {
                const associated = productsData.filter(p =>
                    (p.courier_tracking === tracking.tracking_number && tracking.tracking_number) ||
                    (p.tracking_number === tracking.store_tracking && tracking.store_tracking)
                ).map(p => ({ id: p.id, name: p.name }));

                return {
                    ...tracking,
                    associated_products: associated
                };
            });

            // 5. Merge and Sort
            const allTrackings = [...manualWithProducts, ...virtualTrackings].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setTrackings(allTrackings);
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

    const handleScan = (code: string) => {
        if (targetScan === 'MAIN') {
            handleTrackingNumberChange(code);
        } else if (targetScan === 'SEARCH') {
            setSearchTerm(code);
        } else {
            setStoreTracking(code);
        }
        setIsScanning(false);
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

    const resetForm = () => {
        setTrackingNumber('');
        setStoreTracking('');
        setCourier(defaultCourier);
        setWeightKg('');
        setWeightLb('');
        setNotes('');
        setTrackingType('BUSINESS'); // Default
        setEditingId(null);
    };

    const handleEdit = (tracking: ShipmentTracking) => {
        setEditingId(tracking.id);
        setTrackingNumber(tracking.tracking_number);
        setStoreTracking(tracking.store_tracking || '');
        setCourier(tracking.courier);
        setWeightKg(tracking.weight_kg?.toString() || '');
        setWeightLb(tracking.weight_lb?.toString() || '');
        setNotes(tracking.notes || '');
        setTrackingType(tracking.tracking_type);

        // Scroll to form (top)
        const formElement = document.getElementById('tracker-form-top');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            const payload = {
                user_id: user.id,
                tracking_number: trackingNumber.trim(),
                store_tracking: storeTracking.trim() || null,
                courier: courier.trim(),
                weight_kg: weightKg ? parseFloat(weightKg) : null,
                weight_lb: weightLb ? parseFloat(weightLb) : null,
                notes: notes.trim() || null,
                tracking_type: trackingType,
                status: 'PENDING' // Default for new or re-save
            };

            if (editingId) {
                // UPDATE
                const { error } = await supabase
                    .from('shipment_tracking')
                    .update(payload)
                    .eq('id', editingId);

                if (error) throw error;
                toast.success('Tracking actualizado');
            } else {
                // CREATE
                const { error } = await supabase
                    .from('shipment_tracking')
                    .insert(payload);

                if (error) throw error;
                toast.success('Tracking guardado');
            }

            resetForm();
            await loadTrackings();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;

        try {
            const { error } = await supabase
                .from('shipment_tracking')
                .delete()
                .eq('id', itemToDelete);

            if (error) throw error;

            toast.success('Tracking eliminado');
            await loadTrackings();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar');
        } finally {
            setItemToDelete(null);
        }
    };

    // Filter Logic
    const filteredTrackings = useMemo(() => {
        let results = trackings;

        // 1. Filter by Type
        if (filterType !== 'ALL') {
            results = results.filter(t => t.tracking_type === filterType);
        }

        // 2. Filter by Search Term
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            results = results.filter(t =>
                (t.tracking_number && t.tracking_number.toLowerCase().includes(lowerTerm)) ||
                (t.store_tracking && t.store_tracking.toLowerCase().includes(lowerTerm)) ||
                (t.courier && t.courier.toLowerCase().includes(lowerTerm)) ||
                (t.notes && t.notes.toLowerCase().includes(lowerTerm)) ||
                (t.associated_products && t.associated_products.some(p => p.name.toLowerCase().includes(lowerTerm)))
            );
        }

        return results;
    }, [trackings, searchTerm, filterType]);

    // Pagination
    const paginatedTrackings = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTrackings.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredTrackings, currentPage]);

    const totalPages = Math.ceil(filteredTrackings.length / ITEMS_PER_PAGE);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            {isScanning && (
                <BarcodeScanner
                    onScan={handleScan}
                    onClose={() => setIsScanning(false)}
                />
            )}
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

                <div className="p-4 overflow-y-auto custom-scrollbar flex-1 pb-20 sm:pb-4">
                    {/* Input Form */}
                    <form id="tracker-form-top" onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Briefcase size={18} className="text-blue-600" />
                                {editingId ? 'Editar Tracking' : 'Nuevo Tracking'}
                            </h3>
                            <div className="flex gap-2">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 bg-white border border-slate-200 rounded"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setTrackingType('BUSINESS')}
                                    className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg font-bold text-xs transition-all ${trackingType === 'BUSINESS'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white text-slate-600 border border-slate-200'
                                        }`}
                                >
                                    <Briefcase size={14} />
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
                                <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wider flex justify-between">
                                    Tracking Courier RD *
                                    <button
                                        type="button"
                                        onClick={() => { setTargetScan('MAIN'); setIsScanning(true); }}
                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[10px]"
                                    >
                                        📷 Escanear
                                    </button>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={trackingNumber}
                                        onChange={(e) => handleTrackingNumberChange(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-8"
                                        placeholder="PP-12345 o TEMU-DO..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wider flex justify-between">
                                    Tracking Tienda / USA
                                    <button
                                        type="button"
                                        onClick={() => { setTargetScan('STORE'); setIsScanning(true); }}
                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[10px]"
                                    >
                                        📷 Escanear
                                    </button>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={storeTracking}
                                        onChange={(e) => setStoreTracking(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-8"
                                        placeholder="1Z999... o TBA..."
                                    />
                                </div>
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


                    {/* Search Bar */}
                    {/* Search Bar */}
                    <div className="mb-4 flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar tracking..."
                                className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                            />
                            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />

                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setTargetScan('SEARCH');
                                setIsScanning(true);
                            }}
                            className="shrink-0 aspect-square flex items-center justify-center bg-slate-50 border border-slate-300 rounded-lg text-slate-600 hover:bg-white hover:text-blue-600 hover:border-blue-500 transition-all shadow-sm"
                            title="Escanear para buscar"
                        >
                            <ScanBarcode size={20} />
                        </button>
                    </div>

                    {/* Saved Trackings List with Pagination */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-700">
                                {searchTerm
                                    ? `Resultados (${filteredTrackings.length})`
                                    : `Trackings Guardados (${trackings.length})`}
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

                                                    {/* Secondary Tracking (Store/USA) when Main is Courier */}
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

                                                {/* Associated Products */}
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
                                                            onClick={() => handleEdit(tracking)}
                                                            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                                                            title="Editar"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => setItemToDelete(tracking.id)}
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

                {itemToDelete && (
                    <ConfirmModal 
                        title="Eliminar Tracking"
                        message="¿Estás seguro de que deseas eliminar este registro de tracking? Esta acción no se puede deshacer."
                        onConfirm={handleDelete}
                        onCancel={() => setItemToDelete(null)}
                    />
                )}
            </div>
        </div>
    );
};

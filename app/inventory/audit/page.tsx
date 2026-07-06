'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ScanLine, CheckCircle2, AlertTriangle, Save, Loader2, PackageSearch } from 'lucide-react';
import { Product } from '../../../types';
import { toast } from 'sonner';

export default function InventoryAuditPage() {
    const router = useRouter();
    const [expectedProducts, setExpectedProducts] = useState<Product[]>([]);
    const [scannedSkus, setScannedSkus] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [skuInput, setSkuInput] = useState('');

    useEffect(() => {
        loadExpectedInventory();
    }, []);

    const loadExpectedInventory = async () => {
        setIsLoading(true);
        try {
            // Only bring items that are supposed to be physically in stock
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('status', 'RECEIVED');
            
            if (error) throw error;
            setExpectedProducts(data || []);
        } catch (error: any) {
            console.error('Error loading inventory:', error);
            toast.error('Error al cargar inventario base');
        } finally {
            setIsLoading(false);
        }
    };

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!skuInput.trim()) return;

        const cleanSku = skuInput.trim().toUpperCase();
        
        // Prevent duplicate scanning alerts
        if (scannedSkus.has(cleanSku)) {
            toast.info(`El SKU ${cleanSku} ya fue escaneado.`);
        } else {
            setScannedSkus(prev => new Set(prev).add(cleanSku));
            // Check if it was expected
            if (expectedProducts.some(p => p.sku?.toUpperCase() === cleanSku)) {
                toast.success('Producto verificado', { position: 'top-center' });
            } else {
                toast.error(`¡Alerta! El SKU ${cleanSku} no está en sistema o ya fue vendido.`, { position: 'top-center', duration: 4000 });
            }
        }
        setSkuInput('');
    };

    const expectedSkusMap = new Map(expectedProducts.map(p => [p.sku?.toUpperCase() || p.id, p]));
    
    const verifiedProducts = expectedProducts.filter(p => p.sku && scannedSkus.has(p.sku.toUpperCase()));
    const missingProducts = expectedProducts.filter(p => !p.sku || !scannedSkus.has(p.sku.toUpperCase()));
    const extraSkus = Array.from(scannedSkus).filter(sku => !expectedSkusMap.has(sku));

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 relative">
            <header className="sticky top-0 z-20 pt-6 pb-4 px-4 bg-slate-900 text-white flex items-center gap-3">
                <button
                    onClick={() => router.push('/')}
                    className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <PackageSearch size={22} className="text-indigo-400" /> Auditoría
                    </h1>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Conteo Físico</p>
                </div>
            </header>

            <div className="p-4">
                {/* Scanner Input */}
                <form onSubmit={handleScan} className="mb-6 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <ScanLine size={24} />
                    </div>
                    <input
                        type="text"
                        autoFocus
                        placeholder="Escanea el SKU aquí..."
                        value={skuInput}
                        onChange={e => setSkuInput(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-indigo-500/30 rounded-2xl text-lg font-black tracking-widest uppercase focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20 outline-none shadow-lg shadow-indigo-100 transition-all"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm">
                        Check
                    </button>
                </form>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p className="text-sm font-bold">Preparando base de datos...</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
                                <span className="block text-2xl font-black text-slate-800">{expectedProducts.length}</span>
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">En Sistema</span>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center">
                                <span className="block text-2xl font-black text-emerald-600">{verifiedProducts.length}</span>
                                <span className="block text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Verificados</span>
                            </div>
                            <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl text-center">
                                <span className="block text-2xl font-black text-rose-600">{missingProducts.length}</span>
                                <span className="block text-[9px] font-bold text-rose-600 uppercase tracking-widest">Faltantes</span>
                            </div>
                        </div>

                        {/* Extra Items (Scanned but not in DB) */}
                        {extraSkus.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <AlertTriangle size={16} /> Sobrantes ({extraSkus.length})
                                </h3>
                                <p className="text-xs text-amber-700/80 mb-3 leading-relaxed">Estos códigos fueron escaneados pero no figuran como "En Stock". Puede que ya se hayan vendido o no estén registrados.</p>
                                <div className="flex flex-wrap gap-2">
                                    {extraSkus.map(sku => (
                                        <span key={sku} className="bg-white text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">{sku}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Missing Items */}
                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Faltantes ({missingProducts.length})</h3>
                            </div>
                            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                                {missingProducts.length === 0 ? (
                                    <div className="p-8 text-center text-emerald-600 flex flex-col items-center">
                                        <CheckCircle2 size={40} className="mb-2 opacity-50" />
                                        <span className="font-bold text-sm">¡Auditoría perfecta!</span>
                                    </div>
                                ) : (
                                    missingProducts.map(p => (
                                        <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-rose-50 text-rose-300 rounded-xl flex items-center justify-center shrink-0">
                                                    <PackageSearch size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-700 line-clamp-1">{p.name}</p>
                                                    <p className="text-xs font-black text-slate-400 font-mono mt-0.5">{p.sku || 'SIN SKU'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

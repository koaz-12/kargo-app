'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Download, Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DataExportSettings() {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No autorizado');

            // Fetch all products
            const { data: products, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!products || products.length === 0) {
                toast.error('No hay datos para exportar');
                return;
            }

            // Create CSV
            const headers = ['ID', 'SKU', 'Nombre', 'Estado', 'Plataforma', 'Courier', 'Precio Compra', 'Precio Final (Estimado)', 'Stock', 'Fecha Creación'];
            
            const rows = products.map(p => [
                p.id,
                p.sku || '',
                `"${p.name?.replace(/"/g, '""') || ''}"`,
                p.status || '',
                p.platform || '',
                p.courier || '',
                p.buy_price || 0,
                p.final_price || 0,
                p.stock || 0,
                new Date(p.created_at).toLocaleDateString()
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            // Download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `kargo_inventario_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Inventario exportado correctamente');
        } catch (error: any) {
            console.error('Error exporting data:', error);
            toast.error('Error al exportar datos');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 dark:border-slate-800 overflow-hidden mb-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="p-4">
                <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                    <Database size={16} className="text-slate-400" />
                    Exportar Datos
                </p>
                <p className="text-xs text-slate-400 mb-4">Descarga tu inventario completo en formato Excel (.csv).</p>

                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                    {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                    <span>{isExporting ? 'Generando archivo...' : 'Exportar Inventario a CSV'}</span>
                </button>
            </div>
        </div>
    );
}

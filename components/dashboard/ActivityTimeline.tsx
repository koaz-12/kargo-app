'use client';

import React from 'react';
import { Clock, Plus, Edit2, CheckCircle2, Trash2, Package } from 'lucide-react';

interface ActivityLog {
    id: string;
    action: string;
    entity_name: string;
    created_at: string;
}

interface ActivityTimelineProps {
    logs: ActivityLog[];
    loading?: boolean;
}

const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
        case 'created':
            return <div className="bg-blue-100 text-blue-600 p-1.5 rounded-full"><Plus size={14} strokeWidth={3} /></div>;
        case 'updated':
            return <div className="bg-amber-100 text-amber-600 p-1.5 rounded-full"><Edit2 size={14} strokeWidth={3} /></div>;
        case 'sold':
            return <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-full"><CheckCircle2 size={14} strokeWidth={3} /></div>;
        case 'deleted':
            return <div className="bg-red-100 text-red-600 p-1.5 rounded-full"><Trash2 size={14} strokeWidth={3} /></div>;
        default:
            return <div className="bg-slate-100 text-slate-600 p-1.5 rounded-full"><Package size={14} strokeWidth={3} /></div>;
    }
};

const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
    return Math.floor(seconds) < 30 ? 'justo ahora' : `hace ${Math.floor(seconds)} segundos`;
};

const getActionText = (action: string) => {
    switch (action.toLowerCase()) {
        case 'created': return 'Añadió';
        case 'updated': return 'Editó';
        case 'sold': return 'Vendió';
        case 'deleted': return 'Eliminó';
        default: return 'Modificó';
    }
};

export default function ActivityTimeline({ logs, loading }: ActivityTimelineProps) {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Clock size={18} className="text-slate-400" />
                Actividad Reciente
            </h3>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 items-start animate-pulse">
                            <div className="w-7 h-7 bg-slate-100 rounded-full shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 bg-slate-100 rounded w-3/4" />
                                <div className="h-2 bg-slate-50 rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No hay actividad reciente.
                </p>
            ) : (
                <div className="space-y-4">
                    {logs.map((log, index) => (
                        <div key={log.id} className="flex gap-3 items-start relative">
                            {/* Vertical Line */}
                            {index !== logs.length - 1 && (
                                <div className="absolute left-[13px] top-7 bottom-[-16px] w-[2px] bg-slate-100" />
                            )}
                            
                            <div className="shrink-0 relative z-10 bg-white">
                                {getActionIcon(log.action)}
                            </div>
                            
                            <div className="flex-1 pt-0.5">
                                <p className="text-sm text-slate-700 leading-tight">
                                    <span className="font-bold">{getActionText(log.action)}</span>{' '}
                                    <span className="font-medium">"{log.entity_name}"</span>
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium mt-1">
                                    {timeAgo(log.created_at)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

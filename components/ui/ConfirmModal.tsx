import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmModalProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({ 
    title, 
    message, 
    confirmText = 'Eliminar', 
    cancelText = 'Cancelar', 
    onConfirm, 
    onCancel 
}: ConfirmModalProps) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 mb-8 leading-relaxed">{message}</p>
                    
                    <div className="flex w-full gap-3">
                        <button 
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button 
                            type="button"
                            onClick={onConfirm}
                            className="flex-1 px-4 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/30"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Bot, Sparkles, X, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { FormState } from '../../../types';
import { toast } from 'sonner';

interface BatchImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (items: Partial<FormState>[]) => void;
}

export default function BatchImportModal({ isOpen, onClose, onImport }: BatchImportModalProps) {
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleImport = () => {
        setError('');
        if (!jsonInput.trim()) {
            setError('Pega el código JSON que te dio Gemini');
            return;
        }

        try {
            const parsed = JSON.parse(jsonInput);
            if (!Array.isArray(parsed)) {
                throw new Error("El JSON debe ser una lista (array) de productos. Ej: [ { ... } ]");
            }
            
            // Basic validation
            const validItems = parsed.filter(item => item && item.name && item.buyPrice !== undefined);
            if (validItems.length === 0) {
                throw new Error("No se encontraron productos válidos en el JSON. Deben tener 'name' y 'buyPrice'.");
            }

            onImport(validItems);
            setJsonInput('');
            onClose();
        } catch (err: any) {
            setError(err.message || 'El formato JSON es inválido');
        }
    };

    const promptText = `Actúa como mi asistente de inventario. Necesito que generes una lista de N productos en formato JSON estricto. Cada producto debe tener EXACTAMENTE esta estructura:

[
  {
    "name": "Nombre del Producto Completo",
    "buyPrice": 10.50,
    "shippingCost": 0,
    "sku": "SKU-OPCIONAL",
    "salePrice": 30.00
  }
]

Asegúrate de responder SOLO con el código JSON, sin ningún otro texto.`;

    const copyPrompt = () => {
        navigator.clipboard.writeText(promptText);
        toast.success("¡Instrucción copiada! Pégasela a Gemini.");
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-5 text-white flex justify-between items-start relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles size={64} /></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <Bot size={24} />
                            <h2 className="text-xl font-bold">Importar desde IA</h2>
                        </div>
                        <p className="text-indigo-100 text-sm">Pega aquí el JSON generado por Gemini o ChatGPT para crear múltiples productos al instante.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
                    {/* Instructions */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                        <p className="text-sm text-indigo-800 font-medium mb-2">1. Pídele esto a la Inteligencia Artificial:</p>
                        <div className="bg-white border border-indigo-100 rounded-xl p-3 flex gap-3 items-start relative group">
                            <p className="text-xs text-slate-500 font-mono line-clamp-3 select-all">{promptText}</p>
                            <button 
                                onClick={copyPrompt}
                                className="shrink-0 p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                title="Copiar instrucción"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <label className="text-sm text-slate-700 font-medium mb-2">2. Pega el JSON generado aquí:</label>
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            className="flex-1 w-full min-h-[200px] border border-slate-200 rounded-2xl p-4 text-sm font-mono text-slate-600 focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-slate-50"
                            placeholder={'[\n  {\n    "name": "Ejemplo",\n    "buyPrice": 10\n  }\n]'}
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle size={14} /> {error}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleImport}
                        className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                        <CheckCircle size={18} />
                        Procesar Lote
                    </button>
                </div>
            </div>
        </div>
    );
}

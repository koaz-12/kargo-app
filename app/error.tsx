'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <AlertTriangle size={40} className="text-red-500" />
      </div>
      
      <h2 className="text-2xl font-black text-slate-800 mb-2">¡Ups! Algo salió mal</h2>
      <p className="text-slate-500 mb-8 max-w-sm">
        Ha ocurrido un error inesperado en la aplicación. No te preocupes, tus datos están a salvo.
      </p>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 w-full max-w-sm overflow-hidden">
        <p className="text-xs font-mono text-slate-600 text-left truncate">
          {error.message || "Error desconocido"}
        </p>
      </div>
      
      <button
        onClick={() => reset()}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg active:scale-95 transition-all flex items-center gap-2"
      >
        <RefreshCcw size={18} />
        Volver a intentar
      </button>
    </div>
  );
}

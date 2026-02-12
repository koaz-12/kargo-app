'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ValidationErrorsProps {
    errors: Record<string, string[]>;
}

export const ValidationErrors: React.FC<ValidationErrorsProps> = ({ errors }) => {
    const errorEntries = Object.entries(errors);

    if (errorEntries.length === 0) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-800">
                <AlertCircle size={18} />
                <h4 className="font-bold text-sm">Errores de Validación</h4>
            </div>
            <ul className="space-y-1">
                {errorEntries.map(([field, messages]) => (
                    <li key={field} className="text-xs text-red-700">
                        <span className="font-semibold capitalize">{field.replace('_', ' ')}</span>: {messages.join(', ')}
                    </li>
                ))}
            </ul>
        </div>
    );
};

'use client';

import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
    type: AlertType;
    title?: string;
    message: string;
    onClose?: () => void;
}

const alertStyles: Record<AlertType, { container: string; icon: JSX.Element }> = {
    info: {
        container: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: <Info className="text-blue-600" size={20} />,
    },
    success: {
        container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        icon: <CheckCircle className="text-emerald-600" size={20} />,
    },
    warning: {
        container: 'bg-amber-50 border-amber-200 text-amber-800',
        icon: <AlertCircle className="text-amber-600" size={20} />,
    },
    error: {
        container: 'bg-red-50 border-red-200 text-red-800',
        icon: <XCircle className="text-red-600" size={20} />,
    },
};

export const Alert: React.FC<AlertProps> = ({ type, title, message, onClose }) => {
    const style = alertStyles[type];

    return (
        <div
            className={`rounded-lg border p-4 ${style.container} flex items-start gap-3`}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
            <div className="flex-1">
                {title && <h4 className="font-semibold mb-1">{title}</h4>}
                <p className="text-sm">{message}</p>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
                    aria-label="Close alert"
                >
                    <XCircle size={18} />
                </button>
            )}
        </div>
    );
};

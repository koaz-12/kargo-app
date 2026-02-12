'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-4">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="text-red-500" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">
                            Algo salió mal
                        </h2>
                        <p className="text-sm text-slate-600 mb-4">
                            Ha ocurrido un error inesperado. Intenta recargar la página.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
                        >
                            Recargar Página
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-4 text-left">
                                <summary className="text-xs text-slate-500 cursor-pointer">
                                    Detalles del error (dev only)
                                </summary>
                                <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-auto">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

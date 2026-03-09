'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useIsMutating } from '@tanstack/react-query';

export function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [showReconnected, setShowReconnected] = useState(false);
    const pendingMutations = useIsMutating();

    useEffect(() => {
        // Check initial state
        if (typeof navigator !== 'undefined') {
            setIsOnline(navigator.onLine);
        }

        const handleOnline = () => {
            setIsOnline(true);
            setShowReconnected(true);
            setTimeout(() => setShowReconnected(false), 4000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowReconnected(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline && !showReconnected && pendingMutations === 0) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300 flex flex-col items-center gap-2 pointer-events-none">
            {!isOnline && (
                <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold pointer-events-auto">
                    <WifiOff size={16} />
                    <span>Modo Offline</span>
                </div>
            )}

            {isOnline && showReconnected && (
                <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold pointer-events-auto">
                    <Wifi size={16} />
                    <span>Conexión restaurada</span>
                </div>
            )}

            {/* Syncing Indicator */}
            {isOnline && pendingMutations > 0 && !showReconnected && (
                <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold pointer-events-auto">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Sincronizando {pendingMutations} cambios...</span>
                </div>
            )}
        </div>
    );
}

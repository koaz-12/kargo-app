'use client';

import { useState, useEffect } from 'react';
import { Download, MonitorSmartphone } from 'lucide-react';
import { toast } from 'sonner';

// Define the BeforeInstallPromptEvent interface which is not standard in TS yet
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed',
        platform: string
    }>;
    prompt(): Promise<void>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsInstalled(true);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setIsInstallable(false);
            setIsInstalled(true);
            setDeferredPrompt(null);
            toast.success('¡App instalada correctamente!');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        // We no longer need the prompt. Clear it up.
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    if (isInstalled) {
        return (
            <div className="bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <MonitorSmartphone size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-100">App Instalada</h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Kargo funciona sin conexión</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isInstallable) {
        return null; // Don't show anything if it can't be installed (e.g. iOS Safari which needs manual "Add to Home Screen" or already installed)
    }

    return (
        <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Download size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-100">Instalar Kargo App</h4>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium leading-relaxed">Instala la aplicación para acceder sin internet y usar el escáner más rápido.</p>
                </div>
            </div>
            <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
            >
                Instalar Ahora
            </button>
        </div>
    );
}

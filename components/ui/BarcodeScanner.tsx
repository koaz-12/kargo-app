'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface BarcodeScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Initialize scanner when component mounts
        const scannerId = "reader";

        // Ensure element exists
        if (!document.getElementById(scannerId)) {
            console.error("Scanner element not found");
            return;
        }

        try {
            const scanner = new Html5QrcodeScanner(
                scannerId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.UPC_A
                    ]
                },
                false // verbose
            );

            scanner.render(
                (decodedText) => {
                    // Success callback
                    console.log("Scanned:", decodedText);
                    // Play beep sound if possible
                    try {
                        const audio = new Audio('/sounds/beep.mp3'); // Optional: beep sound
                        // console.log("Beep"); 
                    } catch (e) {
                        // ignore
                    }

                    onScan(decodedText);
                    toast.success(`Código escaneado: ${decodedText}`);

                    // Stop scanning after success? Usually user wants to scan one thing.
                    // But onClose handles unmount which stops it.
                    // We can just call onClose right away if we want single scan behavior.
                    onClose();
                },
                (errorMessage) => {
                    // Error callback (called frequently when no code found)
                    // console.warn(errorMessage);
                }
            );

            scannerRef.current = scanner;
        } catch (err) {
            console.error("Scanner init error:", err);
            setError("No se pudo iniciar la cámara. Verifica los permisos.");
        }

        // Cleanup
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(error => {
                        console.error("Failed to clear html5-qrcode scanner. ", error);
                    });
                } catch (e) {
                    console.error("Error clearing scanner", e);
                }
            }
        };
    }, [onScan, onClose]);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
                    <h3 className="font-bold flex items-center gap-2">
                        <Camera size={20} />
                        Escanear Código
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 bg-black min-h-[300px] flex items-center justify-center relative">
                    {error ? (
                        <div className="text-red-400 text-center p-4">
                            <p className="font-bold mb-2">Error de Cámara</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : (
                        <div id="reader" className="w-full"></div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 text-center text-xs text-slate-500">
                    Apunta la cámara al código de barras del paquete (Tracking).
                </div>
            </div>
        </div>
    );
};

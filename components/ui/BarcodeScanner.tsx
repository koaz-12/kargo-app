'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

interface BarcodeScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scannerId = "reader";
        let html5QrCode: Html5Qrcode | null = null;

        const startScanner = async () => {
            try {
                // Ensure element exists
                if (!document.getElementById(scannerId)) {
                    throw new Error("Elemento de cámara no encontrado");
                }

                // Create instance
                html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;

                // Check cameras
                const devices = await Html5Qrcode.getCameras();
                if (!devices || devices.length === 0) {
                    throw new Error("No se detectaron cámaras.");
                }

                // Prefer back camera
                const cameraId = devices.find(d => d.label.toLowerCase().includes('back'))?.id || devices[0].id;

                await html5QrCode.start(
                    { facingMode: "environment" }, // Prefer back camera aggressively
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        formatsToSupport: [
                            Html5QrcodeSupportedFormats.CODE_128,
                            Html5QrcodeSupportedFormats.CODE_39,
                            Html5QrcodeSupportedFormats.QR_CODE,
                            Html5QrcodeSupportedFormats.EAN_13,
                        ]
                    },
                    (decodedText) => {
                        // Success
                        console.log("Scanned:", decodedText);
                        onScan(decodedText);
                        toast.success(`Leído: ${decodedText}`);

                        // Stop immediately
                        if (html5QrCode?.isScanning) {
                            html5QrCode.stop().catch(console.error);
                        }
                    },
                    (errorMessage) => {
                        // Ignore scan errors, they happen every frame
                    }
                );

                setIsScanning(true);

            } catch (err: any) {
                console.error("Error starting scanner:", err);

                let msg = "No se pudo acceder a la cámara.";
                if (err?.name === "NotAllowedError") {
                    msg = "Permiso de cámara denegado. Permítelo en tu navegador.";
                } else if (err?.name === "NotFoundError") {
                    msg = "No se encontró ninguna cámara.";
                } else if (err?.name === "NotReadableError") {
                    msg = "La cámara está siendo usada por otra app.";
                } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                    msg = "La cámara requiere HTTPS (o localhost).";
                }

                setError(msg);
            }
        };

        // Delay slightly to ensure render
        const timer = setTimeout(() => {
            startScanner();
        }, 300);

        return () => {
            clearTimeout(timer);
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                    html5QrCode?.clear();
                }).catch(console.error);
            }
        };
    }, [onScan]);

    const handleRetry = () => {
        setError(null);
        // Force re-mount logic effectively
        window.location.reload(); // Too aggressive? Maybe just onClose?
        // Let's just suggest closing and reopening for now or simple close
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 bg-slate-900 text-white shrink-0">
                    <h3 className="font-bold flex items-center gap-2">
                        <Camera size={20} />
                        Escáner
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 bg-black relative flex items-center justify-center min-h-[300px] overflow-hidden">
                    {error ? (
                        <div className="text-white text-center p-6 space-y-4">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                                <Camera size={32} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Error de Cámara</h4>
                                <p className="text-sm text-slate-300">{error}</p>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold flex items-center gap-2 mx-auto hover:bg-slate-200"
                            >
                                <RefreshCcw size={16} />
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <>
                            <div id="reader" className="w-full h-full object-cover"></div>
                            {!isScanning && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                                    <span className="flex items-center gap-2">
                                        <RefreshCcw className="animate-spin" size={20} />
                                        Iniciando cámara...
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="p-4 bg-slate-50 text-center shrink-0">
                    <p className="text-xs text-slate-500 font-medium">
                        Apunta al código de barras o QR
                    </p>
                </div>
            </div>
        </div>
    );
};

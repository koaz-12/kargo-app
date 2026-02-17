'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCcw, Flashlight, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

interface BarcodeScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [hasFlash, setHasFlash] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [maxZoom, setMaxZoom] = useState(1);
    const [supportZoom, setSupportZoom] = useState(false);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Play beep sound using AudioContext (no external file needed)
    const playBeep = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 tone
                gain.gain.setValueAtTime(0.1, ctx.currentTime);

                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            }
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    }, []);

    // Vibrate
    const vibrate = useCallback(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(200);
        }
    }, []);

    const handleSuccessfulScan = useCallback((decodedText: string) => {
        console.log("Scanned:", decodedText);
        playBeep();
        vibrate();
        onScan(decodedText);
        toast.success(`Leído: ${decodedText}`);

        if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().catch(console.error);
        }
        onClose();
    }, [onScan, onClose, playBeep, vibrate]);

    useEffect(() => {
        const scannerId = "reader";
        let html5QrCode: Html5Qrcode | null = null;

        const startScanner = async () => {
            try {
                if (!document.getElementById(scannerId)) {
                    throw new Error("Elemento de cámara no encontrado");
                }

                html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;

                const devices = await Html5Qrcode.getCameras();
                if (!devices || devices.length === 0) {
                    throw new Error("No se detectaron cámaras.");
                }

                // Prefer back camera
                await html5QrCode.start(
                    { facingMode: "environment" },
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
                    (decodedText) => handleSuccessfulScan(decodedText),
                    (errorMessage) => {
                        // Ignore frame errors
                    }
                );

                setIsScanning(true);

                // Check capabilities after start (using a small delay to ensure track is active)
                setTimeout(() => {
                    const videoElement = document.querySelector(`#${scannerId} video`) as HTMLVideoElement;
                    if (videoElement && videoElement.srcObject) {
                        const stream = videoElement.srcObject as MediaStream;
                        const track = stream.getVideoTracks()[0];
                        if (track) {
                            const capabilities = track.getCapabilities();

                            // Check Torch capability
                            if ('torch' in capabilities) {
                                setHasFlash(true);
                            }

                            // Check Zoom capability
                            if ('zoom' in capabilities) {
                                setSupportZoom(true);
                                // @ts-ignore
                                setMaxZoom(capabilities.zoom?.max || 10);
                            }
                        }
                    }
                }, 1000);

            } catch (err: any) {
                console.error("Error starting scanner:", err);

                let msg = "No se pudo acceder a la cámara.";
                if (err?.name === "NotAllowedError") {
                    msg = "Permiso de cámara denegado. Permítelo en tu navegador.";
                } else if (err?.name === "NotFoundError") {
                    msg = "No se encontró ninguna cámara.";
                } else if (err?.name === "NotReadableError") {
                    msg = "La cámara está siendo usada por otra app.";
                } else if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                    msg = "La cámara requiere HTTPS (o localhost).";
                }

                setError(msg);
            }
        };

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
    }, [handleSuccessfulScan]);

    const handleRetry = () => {
        setError(null);
        window.location.reload();
    };

    const toggleFlash = async () => {
        if (!scannerRef.current) return;

        try {
            const videoElement = document.querySelector(`#reader video`) as HTMLVideoElement;
            if (videoElement && videoElement.srcObject) {
                const stream = videoElement.srcObject as MediaStream;
                const track = stream.getVideoTracks()[0];
                const newFlashState = !isFlashOn;
                await track.applyConstraints({
                    // @ts-ignore
                    advanced: [{ torch: newFlashState }]
                });
                setIsFlashOn(newFlashState);
            }
        } catch (err) {
            console.error("Flash toggle failed", err);
            toast.error("No se pudo activar la linterna");
        }
    };

    const handleZoomChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = parseFloat(e.target.value);
        setZoom(newZoom);

        try {
            const videoElement = document.querySelector(`#reader video`) as HTMLVideoElement;
            if (videoElement && videoElement.srcObject) {
                const stream = videoElement.srcObject as MediaStream;
                const track = stream.getVideoTracks()[0];
                await track.applyConstraints({
                    // @ts-ignore
                    advanced: [{ zoom: newZoom }]
                });
            }
        } catch (err) {
            console.error("Zoom failed", err);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        if (!scannerRef.current) return;

        try {
            const result = await scannerRef.current.scanFileV2(file, true);
            if (result) {
                handleSuccessfulScan(result.decodedText);
            }
        } catch (err) {
            console.error("Error reading file", err);
            toast.error("No se detectó ningún código en la imagen");
        } finally {
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] border border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-slate-950/50 text-white shrink-0 z-10">
                    <h3 className="font-bold flex items-center gap-2 text-lg">
                        <Camera size={20} className="text-blue-500" />
                        Escáner Pro
                    </h3>
                    <div className="flex items-center gap-3">
                        {/* Gallery Upload Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors relative"
                            title="Subir imagen"
                        >
                            <ImageIcon size={18} className="text-slate-300" />
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Camera Viewport */}
                <div className="flex-1 bg-black relative flex items-center justify-center min-h-[350px] overflow-hidden group">
                    {error ? (
                        <div className="text-white text-center p-6 space-y-4 z-20">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                                <Camera size={32} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Error de Cámara</h4>
                                <p className="text-sm text-slate-300">{error}</p>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-bold flex items-center gap-2 mx-auto hover:bg-slate-200 transition-colors"
                            >
                                <RefreshCcw size={16} />
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <>
                            <div id="reader" className="w-full h-full object-cover [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>

                            {/* Visual Overlay (Always visible when scanning) */}
                            {isScanning && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    {/* Dark overlay around the scan box */}
                                    <div className="absolute inset-0 bg-black/40"></div>

                                    {/* Scan Box */}
                                    <div className="w-64 h-64 border-2 border-transparent rounded-3xl relative z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] overflow-hidden">
                                        {/* Corners */}
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>

                                        {/* Scanning Laser Animation */}
                                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                                    </div>
                                </div>
                            )}

                            {!isScanning && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white z-20">
                                    <span className="flex items-center gap-3">
                                        <RefreshCcw className="animate-spin text-blue-500" size={24} />
                                        <span className="font-medium animate-pulse">Iniciando cámara...</span>
                                    </span>
                                </div>
                            )}

                            {/* Floating flash control */}
                            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 z-20 px-4 pointer-events-none">
                                {hasFlash && (
                                    <button
                                        onClick={toggleFlash}
                                        className={`p-4 rounded-full backdrop-blur-md shadow-lg transition-all pointer-events-auto ${isFlashOn
                                                ? 'bg-yellow-400 text-black shadow-yellow-400/20'
                                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                            }`}
                                    >
                                        <Flashlight size={24} fill={isFlashOn ? "currentColor" : "none"} />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-5 bg-slate-900 shrink-0 space-y-4 border-t border-slate-800">
                    {/* Zoom Control */}
                    {supportZoom && !error && (
                        <div className="flex items-center gap-3 px-2">
                            <ZoomOut size={16} className="text-slate-400" />
                            <input
                                type="range"
                                min="1"
                                max={maxZoom}
                                step="0.1"
                                value={zoom}
                                onChange={handleZoomChange}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                            />
                            <ZoomIn size={16} className="text-slate-400" />
                        </div>
                    )}

                    <p className="text-xs text-center text-slate-400 font-medium">
                        Apunta al código. Usa <ImageIcon size={12} className="inline mx-0.5 text-blue-400" /> para subir una foto.
                    </p>
                </div>
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0%, 100% { transform: translateY(-80px); opacity: 0; }
                    50% { transform: translateY(80px); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

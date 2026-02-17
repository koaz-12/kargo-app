'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCcw, Flashlight, Image as ImageIcon, ZoomIn, ZoomOut, ScanText, FileText, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { createWorker } from 'tesseract.js';

interface BarcodeScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

type ScanMode = 'BARCODE' | 'TEXT';

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMode, setScanMode] = useState<ScanMode>('BARCODE');
    const [isProcessingText, setIsProcessingText] = useState(false);
    const [ocrResult, setOcrResult] = useState<string | null>(null);

    // Hardware controls
    const [hasFlash, setHasFlash] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [maxZoom, setMaxZoom] = useState(1);
    const [supportZoom, setSupportZoom] = useState(false);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const workerRef = useRef<any>(null);

    // Audio Context for Beep
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
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);

                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            }
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    }, []);

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

    // Initialize Tesseract Worker
    useEffect(() => {
        const initWorker = async () => {
            const worker = await createWorker('eng');
            workerRef.current = worker;
        };
        initWorker();

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, []);

    // Initialize Camera
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

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        // Responsive QR Box
                        qrbox: (viewfinderWidth, viewfinderHeight) => {
                            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                            if (scanMode === 'TEXT') {
                                // Wider box for text
                                return {
                                    width: Math.floor(viewfinderWidth * 0.9),
                                    height: Math.floor(viewfinderHeight * 0.25)
                                };
                            }
                            return {
                                width: Math.floor(minEdge * 0.8),
                                height: Math.floor(minEdge * 0.5)
                            };
                        },
                        aspectRatio: 1.0,
                        formatsToSupport: [
                            Html5QrcodeSupportedFormats.CODE_128,
                            Html5QrcodeSupportedFormats.CODE_39,
                            Html5QrcodeSupportedFormats.CODE_93,
                            Html5QrcodeSupportedFormats.QR_CODE,
                            Html5QrcodeSupportedFormats.EAN_13,
                            Html5QrcodeSupportedFormats.EAN_8,
                            Html5QrcodeSupportedFormats.ITF,
                            Html5QrcodeSupportedFormats.UPC_A,
                            Html5QrcodeSupportedFormats.UPC_E,
                            Html5QrcodeSupportedFormats.CODABAR,
                            Html5QrcodeSupportedFormats.PDF_417,
                            Html5QrcodeSupportedFormats.AZTEC,
                            Html5QrcodeSupportedFormats.DATA_MATRIX
                        ]
                    },
                    (decodedText) => {
                        if (scanMode === 'BARCODE') {
                            handleSuccessfulScan(decodedText);
                        }
                    },
                    () => { } // Ignore errors
                );

                setIsScanning(true);

                // Check Camera Capabilities
                setTimeout(() => {
                    const videoElement = document.querySelector(`#${scannerId} video`) as HTMLVideoElement;
                    if (videoElement && videoElement.srcObject) {
                        const stream = videoElement.srcObject as MediaStream;
                        const track = stream.getVideoTracks()[0];
                        if (track) {
                            const capabilities = track.getCapabilities();
                            if ('torch' in capabilities) setHasFlash(true);
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
                if (err?.name === "NotAllowedError") msg = "Permiso de cámara denegado.";
                else if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') msg = "Requiere HTTPS.";
                setError(msg);
            }
        };

        const timer = setTimeout(() => {
            startScanner();
        }, 300);

        return () => {
            clearTimeout(timer);
            if (html5QrCode?.isScanning) {
                html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
            }
        };
    }, [handleSuccessfulScan, scanMode]); // Re-init if mode changes to update qrbox

    const captureAndReadText = async () => {
        if (!workerRef.current || isProcessingText) return;
        setIsProcessingText(true);
        setOcrResult(null);

        try {
            const videoElement = document.querySelector(`#reader video`) as HTMLVideoElement;
            if (!videoElement) throw new Error("Video stream not found");

            // Create canvas to capture frame
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Canvas context failed");

            // Draw current frame
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            // Process with Tesseract
            const result = await workerRef.current.recognize(canvas);

            // Filter text: looking for uppercase alphanumeric strings >= 5 chars
            const rawText = result.data.text;
            console.log("OCR Raw:", rawText);

            // Heuristic cleanup
            const lines = rawText.split('\n');
            const potentialTrackings = lines
                .map((line: string) => line.replace(/[^a-zA-Z0-9-]/g, '').trim()) // Remove noise
                .filter((line: string) => line.length >= 5 && /[A-Z0-9]/.test(line)); // At least 5 chars, alphanumeric

            if (potentialTrackings.length > 0) {
                // Take the longest or most likely one
                // Sort by length desc
                potentialTrackings.sort((a: string, b: string) => b.length - a.length);
                const bestMatch = potentialTrackings[0];
                setOcrResult(bestMatch);
                playBeep();
                vibrate();
            } else {
                toast.error("No se detectó texto legible. Intenta acercarte o mejorar la luz.");
            }

        } catch (e) {
            console.error("OCR Error", e);
            toast.error("Error al leer texto");
        } finally {
            setIsProcessingText(false);
        }
    };

    const handleRetry = () => {
        setError(null);
        window.location.reload();
    };

    const toggleFlash = async () => {
        if (!scannerRef.current) return;
        try {
            const videoElement = document.querySelector(`#reader video`) as HTMLVideoElement;
            if (videoElement?.srcObject) {
                const stream = videoElement.srcObject as MediaStream;
                const track = stream.getVideoTracks()[0];
                const newFlashState = !isFlashOn;
                // @ts-ignore
                await track.applyConstraints({ advanced: [{ torch: newFlashState }] });
                setIsFlashOn(newFlashState);
            }
        } catch (err) { toast.error("Linterna no disponible"); }
    };

    const handleZoomChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = parseFloat(e.target.value);
        setZoom(newZoom);
        try {
            const videoElement = document.querySelector(`#reader video`) as HTMLVideoElement;
            if (videoElement?.srcObject) {
                const stream = videoElement.srcObject as MediaStream;
                const track = stream.getVideoTracks()[0];
                // @ts-ignore
                await track.applyConstraints({ advanced: [{ zoom: newZoom }] });
            }
        } catch (err) { }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        try {
            if (scanMode === 'BARCODE') {
                if (scannerRef.current) {
                    const result = await scannerRef.current.scanFileV2(file, true);
                    if (result) handleSuccessfulScan(result.decodedText);
                }
            } else {
                // OCR from file
                if (!workerRef.current) return;
                setIsProcessingText(true);
                const result = await workerRef.current.recognize(file);
                const cleanedText = result.data.text.replace(/[^a-zA-Z0-9-]/g, '').trim();
                setOcrResult(cleanedText);
                setIsProcessingText(false);
            }
        } catch (err) {
            toast.error("No se pudo leer la imagen");
            setIsProcessingText(false);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[95vh] border border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-slate-950/80 text-white shrink-0 z-10 gap-4">
                    <h3 className="font-bold flex items-center gap-2 text-sm sm:text-base whitespace-nowrap overflow-hidden text-ellipsis">
                        {scanMode === 'BARCODE' ? <Camera size={18} className="text-blue-500 shrink-0" /> : <FileText size={18} className="text-green-500 shrink-0" />}
                        {scanMode === 'BARCODE' ? 'Scan Código' : 'Scan Texto'}
                    </h3>

                    <div className="flex items-center bg-slate-800 rounded-full p-0.5 shrink-0">
                        <button
                            onClick={() => setScanMode('BARCODE')}
                            className={`p-1.5 rounded-full transition-all ${scanMode === 'BARCODE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                                }`}
                            title="Modo Código de Barras"
                        >
                            <ScanText size={16} />
                        </button>
                        <button
                            onClick={() => setScanMode('TEXT')}
                            className={`p-1.5 rounded-full transition-all ${scanMode === 'TEXT' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                                }`}
                            title="Modo Texto (OCR)"
                        >
                            <FileText size={16} />
                        </button>
                    </div>

                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-colors shrink-0">
                        <X size={18} />
                    </button>
                </div>

                {/* Camera Viewport */}
                <div className="flex-1 bg-black relative flex items-center justify-center min-h-[350px] overflow-hidden group">
                    {error ? (
                        <div className="text-white text-center p-6 space-y-4 z-20">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                                <Camera size={32} />
                            </div>
                            <p className="text-sm text-slate-300">{error}</p>
                            <button onClick={handleRetry} className="px-5 py-2 bg-white text-black rounded-lg text-sm font-bold flex items-center gap-2 mx-auto">
                                <RefreshCcw size={16} /> Reintentar
                            </button>
                        </div>
                    ) : (
                        <>
                            <div id="reader" className="w-full h-full object-cover [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>

                            {/* Visual Overlay */}
                            {isScanning && !ocrResult && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="absolute inset-0 bg-black/30"></div>
                                    <div className={`border-2 border-transparent rounded-2xl relative z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 ${scanMode === 'TEXT' ? 'w-[90%] h-[20%]' : 'w-64 h-64'
                                        }`}>
                                        <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl ${scanMode === 'TEXT' ? 'border-green-500' : 'border-blue-500'}`}></div>
                                        <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl ${scanMode === 'TEXT' ? 'border-green-500' : 'border-blue-500'}`}></div>
                                        <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl ${scanMode === 'TEXT' ? 'border-green-500' : 'border-blue-500'}`}></div>
                                        <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-xl ${scanMode === 'TEXT' ? 'border-green-500' : 'border-blue-500'}`}></div>

                                        {/* Scanner Line */}
                                        <div className={`absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent to-transparent shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[scan_2s_ease-in-out_infinite] ${scanMode === 'TEXT' ? 'via-green-500 shadow-green-500' : 'via-red-500 shadow-red-500'
                                            }`}></div>
                                    </div>

                                    {scanMode === 'TEXT' && (
                                        <div className="absolute top-[25%] text-white/90 text-sm font-bold bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-sm pointer-events-auto border border-white/10">
                                            Alinea el texto aquí
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* OCR Result Overlay */}
                            {ocrResult && (
                                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-xl p-4 shadow-2xl z-50 animate-in zoom-in-95 duration-200">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Texto Detectado</h4>
                                    <div className="bg-slate-100 p-3 rounded-lg text-lg font-mono font-bold text-slate-800 break-all mb-4 text-center border border-slate-200">
                                        {ocrResult}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setOcrResult(null)}
                                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-black"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => handleSuccessfulScan(ocrResult)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                                        >
                                            <Check size={16} /> Confirmar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Processing Indicator */}
                            {isProcessingText && (
                                <div className="absolute inset-0 z-50 bg-black/70 flex flex-col items-center justify-center text-white backdrop-blur-md">
                                    <RefreshCcw className="animate-spin mb-3 text-green-400" size={48} />
                                    <p className="font-bold text-lg">Analizando Texto...</p>
                                    <p className="text-xs text-slate-400 mt-2">Esto puede tomar unos segundos</p>
                                </div>
                            )}

                            {/* Flash */}
                            {hasFlash && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
                                    <button
                                        onClick={toggleFlash}
                                        className={`p-3 rounded-full backdrop-blur-md shadow-lg transition-all ${isFlashOn ? 'bg-yellow-400 text-black' : 'bg-black/40 text-white border border-white/20'
                                            }`}
                                    >
                                        <Flashlight size={20} fill={isFlashOn ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-900 shrink-0 space-y-3 border-t border-slate-800">

                    {/* Capture Button for Text Mode */}
                    {scanMode === 'TEXT' && !ocrResult && (
                        <button
                            onClick={captureAndReadText}
                            className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 active:scale-95 transition-all"
                        >
                            <Camera size={20} /> CAPTURAR TEXTO
                        </button>
                    )}

                    {/* Gallery Button (Always available) */}
                    {scanMode === 'BARCODE' && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700"
                        >
                            <ImageIcon size={18} /> Subir Imagen
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                        </button>
                    )}

                    {supportZoom && !error && (
                        <div className="flex items-center gap-3 px-2 pt-1">
                            <ZoomOut size={16} className="text-slate-500" />
                            <input
                                type="range" min="1" max={maxZoom} step="0.1" value={zoom} onChange={handleZoomChange}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <ZoomIn size={16} className="text-slate-500" />
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0%, 100% { transform: translateY(-100%); opacity: 0; }
                    50% { transform: translateY(100%); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

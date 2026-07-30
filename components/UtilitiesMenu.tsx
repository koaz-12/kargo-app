'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Settings, Package, Search, Calculator, Coins } from 'lucide-react';
import { ShipmentTracker } from './modals/ShipmentTracker';
import { PointsCalculator } from './modals/PointsCalculator';
import { CoinsCalculator } from './modals/CoinsCalculator';

export const UtilitiesMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showShipmentTracker, setShowShipmentTracker] = useState(false);
    const [showPointsCalc, setShowPointsCalc] = useState(false);
    const [showCoinsCalc, setShowCoinsCalc] = useState(false);
    const pathname = usePathname();

    // Hide on specific pages
    if (pathname === '/login' || pathname === '/calculator') return null;

    return (
        <>
            {/* Floating Button */}
            <div className="fixed top-4 right-4 z-[100]">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-12 h-12 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center"
                    title="Utilidades"
                >
                    <Settings size={20} className={isOpen ? 'rotate-45 transition-transform duration-200' : 'transition-transform duration-200'} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[90]"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                            <div className="p-2 bg-slate-50 border-b border-slate-200">
                                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide px-2">Utilidades</h3>
                            </div>

                            <div className="py-1">
                                <button
                                    onClick={() => {
                                        setShowShipmentTracker(true);
                                        setIsOpen(false);
                                    }}
                                    className="w-full px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 text-left"
                                >
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Package size={18} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Tracker de Envíos</p>
                                        <p className="text-xs text-slate-500">Peso y tracking</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        setShowPointsCalc(true);
                                        setIsOpen(false);
                                    }}
                                    className="w-full px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 text-left"
                                >
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Calculator size={18} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Calculadora de 3 por $1</p>
                                        <p className="text-xs text-slate-500">Retornos y ganancias</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        setShowCoinsCalc(true);
                                        setIsOpen(false);
                                    }}
                                    className="w-full px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 text-left"
                                >
                                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <Coins size={18} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Calculadora de Monedas</p>
                                        <p className="text-xs text-slate-500">Juego de Coins</p>
                                    </div>
                                </button>

                                <button
                                    disabled
                                    className="w-full px-4 py-3 bg-slate-50 opacity-60 flex items-center gap-3 text-left cursor-not-allowed"
                                >
                                    <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                                        <Search size={18} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Buscar Tracking</p>
                                        <p className="text-[10px] font-bold text-emerald-600 bg-emerald-100 inline-block px-1.5 rounded">PRÓXIMAMENTE</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            {showShipmentTracker && (
                <ShipmentTracker onClose={() => setShowShipmentTracker(false)} />
            )}
            {showPointsCalc && (
                <PointsCalculator onClose={() => setShowPointsCalc(false)} />
            )}
            {showCoinsCalc && (
                <CoinsCalculator onClose={() => setShowCoinsCalc(false)} />
            )}
        </>
    );
};

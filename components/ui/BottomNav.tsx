'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, PlusCircle, Package, Settings } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    if (pathname === '/login' || pathname === '/catalogo') return null;

    const isActive = (path: string) => pathname === path;

    const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
        const active = isActive(href);
        return (
            <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`group flex flex-col items-center justify-center w-[60px] h-[52px] rounded-2xl transition-all duration-300 relative
                    ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                {active && (
                    <div className="absolute inset-0 bg-indigo-50/80 rounded-2xl -z-10 animate-in zoom-in-90 duration-200" />
                )}
                <div className={`relative transition-transform duration-300 ${active ? '-translate-y-0.5' : 'group-hover:-translate-y-0.5'}`}>
                    <Icon
                        size={active ? 22 : 24}
                        strokeWidth={active ? 2.5 : 2}
                        className={active ? 'drop-shadow-sm' : ''}
                    />
                </div>
                <span className={`text-[9px] mt-1 tracking-wide transition-all duration-300 ${active ? 'font-bold opacity-100 translate-y-0' : 'font-medium opacity-0 translate-y-1 absolute bottom-1'}`}>
                    {label}
                </span>
            </Link>
        );
    };

    return (
        <div className="fixed bottom-4 left-0 right-0 z-50 px-4 w-full max-w-md mx-auto pointer-events-none">
            <nav role="navigation" aria-label="Navegación Principal" className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl safe-area-bottom">
                <div className="flex justify-around items-center h-16 w-full px-2">
                    <NavItem href="/" icon={LayoutDashboard} label="Inicio" />
                    <NavItem href="/stats" icon={BarChart3} label="Data" />
                    <NavItem href="/calculator" icon={PlusCircle} label="Añadir" />
                    <NavItem href="/inventory" icon={Package} label="Stock" />
                    <NavItem href="/settings" icon={Settings} label="Ajustes" />
                </div>
            </nav>
        </div>
    );
}

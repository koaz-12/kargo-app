'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, PlusCircle, Package, Settings } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    if (pathname === '/login') return null;

    const isActive = (path: string) => pathname === path;

    const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
        const active = isActive(href);
        return (
            <Link
                href={href}
                className={`group flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 
                    ${active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
                {/* Clean Icon - No Pill Background */}
                <div className="relative p-1">
                    <Icon
                        size={24}
                        strokeWidth={active ? 2.5 : 2}
                        className={`transition-transform duration-200 ${active ? 'scale-110 drop-shadow-sm' : 'scale-100'}`}
                    />
                </div>
                <span className={`text-[10px] leading-none transition-all ${active ? 'font-bold' : 'font-medium'}`}>
                    {label}
                </span>
            </Link>
        );
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md bg-white border-t border-x border-slate-100 z-50 safe-area-bottom pb-safe shadow-[0_-1px_2px_0_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16 w-full px-2">
                <NavItem href="/" icon={LayoutDashboard} label="Inicio" />
                <NavItem href="/stats" icon={BarChart3} label="Estadística" />
                <NavItem href="/calculator" icon={PlusCircle} label="Producto" />
                <NavItem href="/inventory" icon={Package} label="Stock" />
                <NavItem href="/settings" icon={Settings} label="Ajustes" />
            </div>
        </nav>
    );
}

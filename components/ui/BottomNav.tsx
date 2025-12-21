'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, Package, LayoutDashboard, Settings, BarChart3, PlusCircle } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    if (pathname === '/login') return null;

    const isActive = (path: string) => pathname === path;

    const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
        const active = isActive(href);
        return (
            <Link
                href={href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
            >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
            </Link>
        );
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom pb-safe">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
                <NavItem href="/" icon={LayoutDashboard} label="Inicio" />
                <NavItem href="/stats" icon={BarChart3} label="Estadística" />
                <NavItem href="/calculator" icon={PlusCircle} label="Producto" />
                <NavItem href="/inventory" icon={Package} label="Stock" />
                <NavItem href="/settings" icon={Settings} label="Ajustes" />
            </div>
        </nav>
    );
}

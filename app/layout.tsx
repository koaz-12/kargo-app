import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";

import BottomNav from "../components/ui/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kargo",
  description: "Gestión Inteligente de Importaciones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 min-h-[100dvh] w-full`}>
        {/* Main Content */}
        {children}
        <BottomNav />
      </body>
    </html>
  );
}

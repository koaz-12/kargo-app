import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";

import BottomNav from "../components/ui/BottomNav";
import { QueryProvider } from "../providers/QueryProvider";
import { Toaster } from 'sonner';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { NetworkStatus } from '../components/ui/NetworkStatus';
import { ThemeProvider } from './providers/ThemeProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kargo",
  description: "Gestión Inteligente de Importaciones",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kargo',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-[100dvh] w-full transition-colors`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryProvider>
          <ErrorBoundary>
            <NetworkStatus />
            {/* Main Content */}
            {children}
            <BottomNav />
            <Toaster position="top-center" expand={false} richColors />
          </ErrorBoundary>
        </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

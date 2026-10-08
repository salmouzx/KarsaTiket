import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Karsa Tiket — Layanan Tiket Komunitas Kreatif',
  description: 'Aplikasi pencatatan event, pembeli, tiket, dan rekap pendapatan komunitas kreatif Karsa Tiket.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4f46e5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}

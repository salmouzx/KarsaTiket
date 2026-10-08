'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users, Ticket, BarChart3, Sparkles, ShieldCheck } from 'lucide-react';

const NAV_ITEMS = [
  {
    name: 'Event',
    href: '/event',
    icon: Calendar,
    description: 'Kelola acara & kuota',
  },
  {
    name: 'Pembeli',
    href: '/pembeli',
    icon: Users,
    description: 'Daftar & kontak pembeli',
  },
  {
    name: 'Tiket',
    href: '/tiket',
    icon: Ticket,
    description: 'Pencatatan & kehadiran',
  },
  {
    name: 'Rekap',
    href: '/rekap',
    icon: BarChart3,
    description: 'Pendapatan & ringkasan',
  },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <>
      {/* Top Header (Desktop & Mobile) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/event" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight group-hover:text-indigo-600 transition-colors">
                Karsa Tiket
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Menu Utama">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Thumb Friendly) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 shadow-lg"
        aria-label="Navigasi Bawah Mobile"
      >
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                  isActive
                    ? 'text-indigo-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-transform ${
                    isActive ? 'bg-indigo-50 scale-110' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                </div>
                <span className="mt-0.5 tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

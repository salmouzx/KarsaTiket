'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Ticket, CheckCircle2, ChevronDown } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Toast } from '@/components/ui/Toast';

interface EventOption {
  id: string;
  nama: string;
  kuota: number;
  tiket_terjual: number;
  harga_tiket: number;
}

const MOCK_EVENT_OPTIONS: EventOption[] = [
  {
    id: 'Ev27dKm',
    nama: 'Workshop Sablon Tote Bag',
    kuota: 30,
    tiket_terjual: 2,
    harga_tiket: 75000,
  },
  {
    id: 'Ev91aBc',
    nama: 'Konser Akustik Indie Senja',
    kuota: 100,
    tiket_terjual: 100,
    harga_tiket: 50000,
  },
];

export default function RekapPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('Ev27dKm');
  const [viewState, setViewState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const currentEvent = MOCK_EVENT_OPTIONS.find((e) => e.id === selectedEventId) || MOCK_EVENT_OPTIONS[0];

  // Simulasi kalkulasi: pendapatan HANYA dari tiket 'lunas' dan 'hadir'
  // Sesuai Acceptance Criteria PRD 5.4 point 2: tiket 'menunggu_bayar' dan 'dibatalkan' TIDAK ikut dihitung
  const tiketTerjual = currentEvent.tiket_terjual;
  const sisaKuota = Math.max(0, currentEvent.kuota - currentEvent.tiket_terjual);
  const persentaseTerjual = Math.min(100, Math.round((tiketTerjual / currentEvent.kuota) * 100));

  // Simulasi angka pendapatan sah (lunas & hadir)
  const pendapatanSah = tiketTerjual * currentEvent.harga_tiket;
  const pesertaHadir = currentEvent.id === 'Ev27dKm' ? 0 : 75; // Contoh hadir

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Modul Rekap
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              Sumber: event & tiket
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Ringkasan tiket terjual, sisa kuota, total uang masuk sah, dan kehadiran peserta per event.
          </p>
        </div>

        {/* Demo Switcher State */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setViewState('normal')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors ${
              viewState === 'normal' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setViewState('loading')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors ${
              viewState === 'loading' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Loading
          </button>
          <button
            onClick={() => setViewState('empty')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors ${
              viewState === 'empty' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Empty
          </button>
          <button
            onClick={() => setViewState('error')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors ${
              viewState === 'error' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Error
          </button>
        </div>
      </div>

      {/* Select Event Sesuai PRD Bagian 5.4 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label htmlFor="event-select" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Pilih Event yang Direkap:
        </label>
        <div className="relative max-w-sm w-full">
          <select
            id="event-select"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setToastMessage('Data rekap diperbarui');
            }}
            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {MOCK_EVENT_OPTIONS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nama}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* State Handler */}
      {viewState === 'loading' && <LoadingState count={1} />}

      {viewState === 'error' && (
        <ErrorState
          title="Gagal Memuat Rekap"
          message="Koneksi terputus saat mengambil kalkulasi rekapitulasi. Silakan periksa koneksi internet."
          onRetry={() => {
            setViewState('normal');
            setToastMessage('Berhasil memuat ulang rekap');
          }}
        />
      )}

      {viewState === 'empty' && (
        <EmptyState
          icon={<BarChart3 className="w-7 h-7" />}
          title="Event Belum Memiliki Tiket"
          description="Belum ada transaksi tiket yang tercatat pada event ini, sehingga rekapitulasi pendapatan masih kosong."
          actionLabel="Buka Menu Tiket"
          onAction={() => {
            setViewState('normal');
            setToastMessage('Pindah ke menu Tiket untuk mencatat pembelian');
          }}
        />
      )}

      {viewState === 'normal' && (
        <div className="space-y-6">
          {/* Batang Kemajuan (Progress Bar) Penjualan vs Kuota */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-700">Kapasitas Kursi Terisi</span>
              <span className="font-bold text-indigo-700">
                {tiketTerjual} / {currentEvent.kuota} ({persentaseTerjual}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  persentaseTerjual >= 100
                    ? 'bg-rose-500'
                    : persentaseTerjual >= 70
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${persentaseTerjual}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
              <span>0 Terjual</span>
              <span>{sisaKuota === 0 ? 'Habis Terjual!' : `Sisa ${sisaKuota} kursi`}</span>
              <span>Maks {currentEvent.kuota} Kursi</span>
            </div>
          </div>

          {/* 4 Kartu Angka Sesuai PRD Bagian 5.4 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <Ticket className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Tiket Terjual</span>
              <p className="text-2xl font-bold text-slate-900">{tiketTerjual}</p>
              <span className="text-[11px] text-slate-400">Total lembar tercatat</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Sisa Kuota</span>
              <p className="text-2xl font-bold text-slate-900">{sisaKuota}</p>
              <span className="text-[11px] text-slate-400">Dari {currentEvent.kuota} kuota</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Pendapatan Sah</span>
              <p className="text-lg sm:text-xl font-bold text-emerald-700">
                {formatRupiah(pendapatanSah)}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">
                Hanya status Lunas & Hadir
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Peserta Hadir</span>
              <p className="text-2xl font-bold text-slate-900">{pesertaHadir}</p>
              <span className="text-[11px] text-slate-400">Telah check-in di lokasi</span>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toastMessage || ''}
        isVisible={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}

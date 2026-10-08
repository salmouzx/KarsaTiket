'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BarChart3, TrendingUp, Users, Ticket, CheckCircle2, ChevronDown, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Toast } from '@/components/ui/Toast';
import { EventItem, TiketItem } from '@/types/firestore';
import { EventService, RekapService } from '@/lib/firestore-service';

export default function RekapPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [currentEvent, setCurrentEvent] = useState<EventItem | null>(null);
  const [eventTiket, setEventTiket] = useState<TiketItem[]>([]);
  const [viewState, setViewState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ambil daftar event dari Firestore
  const loadInitialData = async () => {
    setViewState('loading');
    try {
      const fetchedEvents = await EventService.getAll();
      setEvents(fetchedEvents);

      if (fetchedEvents.length === 0) {
        setViewState('empty');
        return;
      }

      const initialId = selectedEventId || fetchedEvents[0].id;
      setSelectedEventId(initialId);
      await loadRekapData(initialId, fetchedEvents);
    } catch (err: any) {
      console.error('Error fetching rekap events:', err);
      setViewState('error');
    }
  };

  // Ambil data rekapitulasi untuk event tertentu
  const loadRekapData = async (eventId: string, eventList?: EventItem[]) => {
    try {
      const rekap = await RekapService.getRekapForEvent(eventId);
      const ev = (eventList || events).find((e) => e.id === eventId) || rekap.event;
      setCurrentEvent(ev || null);
      setEventTiket(rekap.tiketList);
      setViewState('normal');
    } catch (err: any) {
      console.error('Error fetching rekap detail:', err);
      setViewState('error');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectEvent = async (eventId: string) => {
    setSelectedEventId(eventId);
    await loadRekapData(eventId);
    setToastMessage('Data rekapitulasi acara berhasil diperbarui');
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Perhitungan Angka Rekapitulasi Sesuai PRD Bagian 5.4:
  const tiketTerjual = currentEvent ? (currentEvent.tiket_terjual || 0) : 0;
  const kuota = currentEvent ? (currentEvent.kuota || 0) : 0;
  const sisaKuota = Math.max(0, kuota - tiketTerjual);
  const persentase = kuota > 0 ? Math.min(100, Math.round((tiketTerjual / kuota) * 100)) : 0;

  // Pendapatan Sah (Acceptance Criteria 2): HANYA dari status 'lunas' dan 'hadir'
  const pendapatanSah = useMemo(() => {
    return eventTiket
      .filter((t) => t.status === 'lunas' || t.status === 'hadir')
      .reduce((sum, t) => sum + (t.total || 0), 0);
  }, [eventTiket]);

  // Peserta Hadir (Status 'hadir')
  const pesertaHadir = useMemo(() => {
    return eventTiket
      .filter((t) => t.status === 'hadir')
      .reduce((sum, t) => sum + (t.jumlah_tiket || 0), 0);
  }, [eventTiket]);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Rekapitulasi Penjualan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ringkasan tiket terjual, sisa kuota, kalkulasi pendapatan, dan kehadiran peserta per acara.
          </p>
        </div>
      </div>

      {/* Konten Berdasarkan State */}
      {viewState === 'loading' && <LoadingState count={2} />}

      {viewState === 'error' && (
        <ErrorState
          title="Gagal Memuat Rekap"
          message="Terjadi kendala saat menghitung data rekapitulasi. Silakan periksa koneksi internet Anda."
          onRetry={loadInitialData}
        />
      )}

      {viewState !== 'loading' && viewState !== 'error' && events.length === 0 && (
        <EmptyState
          icon={<BarChart3 className="w-7 h-7" />}
          title="Belum Ada Acara untuk Direkap"
          description="Tambahkan acara baru dan catat penjualan tiket untuk melihat rekapitulasi pendapatan."
          actionLabel="Tambah Acara Baru"
          onAction={() => {
            window.location.href = '/event';
          }}
        />
      )}

      {viewState !== 'loading' && viewState !== 'error' && events.length > 0 && currentEvent && (
        <div className="space-y-6">
          {/* Select Event (Acceptance Criteria 1) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Pilih Acara yang Direkap:
              </span>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {currentEvent.tanggal}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {currentEvent.lokasi}
                </span>
              </div>
            </div>

            <div className="relative min-w-[280px]">
              <select
                id="rekap-select-event"
                value={selectedEventId}
                onChange={(e) => handleSelectEvent(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs transition-all"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nama} ({ev.tiket_terjual || 0}/{ev.kuota} kursi)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Batang Kemajuan (Progress Bar) Penjualan vs Kuota */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-slate-800">Kapasitas Kursi Terisi</span>
              <span className="text-indigo-700">
                {tiketTerjual} / {kuota} Kursi ({persentase}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  persentase >= 100
                    ? 'bg-rose-500'
                    : persentase >= 75
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${persentase}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
              <span>0 Terjual</span>
              <span className="font-semibold text-slate-600">
                {sisaKuota === 0 ? '🔥 Kuota Habis Terjual!' : `Sisa ${sisaKuota} kursi tersedia`}
              </span>
              <span>Kapasitas {kuota} Kursi</span>
            </div>
          </div>

          {/* 4 Kartu Angka Sesuai PRD Bagian 5.4 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Kartu 1: Tiket Terjual */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <Ticket className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-semibold">Tiket Terjual</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{tiketTerjual}</p>
              <span className="text-[11px] text-slate-400 block">Total lembar tercatat</span>
            </div>

            {/* Kartu 2: Sisa Kuota */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-semibold">Sisa Kuota</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{sisaKuota}</p>
              <span className="text-[11px] text-slate-400 block">Dari total {kuota} kuota</span>
            </div>

            {/* Kartu 3: Pendapatan Sah (Lunas & Hadir) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-semibold">Pendapatan Sah</span>
              <p className="text-lg sm:text-2xl font-extrabold text-emerald-700">
                {formatRupiah(pendapatanSah)}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium block">
                Hanya status Lunas & Hadir
              </span>
            </div>

            {/* Kartu 4: Peserta Hadir (Check-in) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-semibold">Peserta Hadir</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{pesertaHadir}</p>
              <span className="text-[11px] text-slate-400 block">Telah check-in di lokasi</span>
            </div>
          </div>

          {/* Rincian Transaksi Tiket Terkait Acara */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Transaksi Tiket Acara Ini ({eventTiket.length})
              </h3>
              <Link
                href="/tiket"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span>Kelola di Modul Tiket</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {eventTiket.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada transaksi tiket yang tercatat untuk acara ini di Firestore.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {eventTiket.map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-800">{t.nama_pembeli}</span>
                      <span className="text-slate-400 ml-2">({t.jumlah_tiket} tiket)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-700">{formatRupiah(t.total)}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifikasi Toast */}
      <Toast
        message={toastMessage || ''}
        isVisible={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Calendar, Plus, MapPin, Users, Sparkles } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toast } from '@/components/ui/Toast';
import { EventItem } from '@/types/firestore';

// Data contoh awal sesuai Skema Firestore Bab 3
const INITIAL_MOCK_EVENTS: EventItem[] = [
  {
    id: 'Ev27dKm',
    nama: 'Workshop Sablon Tote Bag',
    tanggal: '2026-10-18',
    lokasi: 'Ruang Karsa, Jl. Merdeka No. 21',
    harga_tiket: 75000,
    kuota: 30,
    tiket_terjual: 2,
  },
  {
    id: 'Ev91aBc',
    nama: 'Konser Akustik Indie Senja',
    tanggal: '2026-10-25',
    lokasi: 'Amfiteater Komunitas Karsa',
    harga_tiket: 50000,
    kuota: 100,
    tiket_terjual: 100, // Contoh kuota habis
  },
];

export default function EventPage() {
  const [events, setEvents] = useState<EventItem[]>(INITIAL_MOCK_EVENTS);
  const [viewState, setViewState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Modul Event
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              Koleksi: event
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data acara, tanggal, lokasi, harga tiket, dan batas kuota peserta.
          </p>
        </div>

        {/* Demo Switcher State (Uji 3 State) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setViewState('normal')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors ${
              viewState === 'normal' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Normal ({events.length})
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

      {/* Konten Berdasarkan State */}
      {viewState === 'loading' && <LoadingState count={2} />}

      {viewState === 'error' && (
        <ErrorState
          title="Gagal Memuat Daftar Event"
          message="Tidak dapat membaca koleksi event dari sistem. Silakan periksa jaringan Anda."
          onRetry={() => {
            setViewState('normal');
            setToastMessage('Berhasil memuat ulang data event');
          }}
        />
      )}

      {viewState === 'empty' && (
        <EmptyState
          icon={<Calendar className="w-7 h-7" />}
          title="Belum ada event"
          description="Belum ada acara yang terdaftar di sistem. Mulai buat acara pertama untuk menjual tiket."
          actionLabel="Tambah Event"
          onAction={() => {
            setViewState('normal');
            setToastMessage('Formulir Tambah Event akan aktif penuh di Part 2');
          }}
        />
      )}

      {viewState === 'normal' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Daftar Acara ({events.length})
            </span>
            <button
              onClick={() => setToastMessage('Fitur Tambah Event lengkap akan diimplementasikan pada Part 2')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {events.map((ev) => {
              const sisaKuota = ev.kuota - ev.tiket_terjual;
              const isHabis = sisaKuota <= 0;

              return (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold text-slate-900 text-base leading-snug">
                        {ev.nama}
                      </h2>
                      {isHabis ? (
                        <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Habis
                        </span>
                      ) : (
                        <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Sisa {sisaKuota} Tiket
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ev.tanggal}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="line-clamp-1">{ev.lokasi}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Terjual: <strong>{ev.tiket_terjual}</strong> / {ev.kuota} Kursi
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Harga Tiket</span>
                      <span className="text-sm font-bold text-indigo-700">
                        {ev.harga_tiket === 0 ? 'Gratis' : formatRupiah(ev.harga_tiket)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setToastMessage(`Edit event: ${ev.nama} (Akan lengkap di Part 2)`)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Ubah
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(ev.id)}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteId)}
        title="Hapus Event?"
        message="Event yang dihapus tidak dapat dipulihkan kembali. Pastikan tidak ada tiket aktif yang terkait dengan event ini."
        confirmLabel="Hapus Event"
        cancelLabel="Batal"
        isDangerous={true}
        onConfirm={() => {
          setEvents((prev) => prev.filter((item) => item.id !== confirmDeleteId));
          setConfirmDeleteId(null);
          setToastMessage('Event berhasil dihapus');
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage || ''}
        isVisible={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}

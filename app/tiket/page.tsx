'use client';

import React, { useState, useMemo } from 'react';
import { Ticket, Plus, CheckCircle, XCircle, UserCheck, Calendar, Clock, AlertCircle } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toast } from '@/components/ui/Toast';
import { TiketItem, TiketStatus, STATUS_LABELS } from '@/types/firestore';

// Data contoh dari Skema Firestore Bab 5
const INITIAL_MOCK_TIKET: TiketItem[] = [
  {
    id: 'Tk63fHs',
    event_id: 'Ev27dKm',
    nama_event: 'Workshop Sablon Tote Bag',
    tanggal_event: '2026-10-18',
    pembeli_id: '081355512345',
    nama_pembeli: 'Nadia Putri',
    harga_tiket: 75000,
    jumlah_tiket: 2,
    total: 150000,
    status: 'menunggu_bayar',
  },
  {
    id: 'Tk92gLm',
    event_id: 'Ev27dKm',
    nama_event: 'Workshop Sablon Tote Bag',
    tanggal_event: '2026-10-18',
    pembeli_id: '081298765432',
    nama_pembeli: 'Budi Pratama',
    harga_tiket: 75000,
    jumlah_tiket: 1,
    total: 75000,
    status: 'lunas',
  },
  {
    id: 'Tk11xQa',
    event_id: 'Ev91aBc',
    nama_event: 'Konser Akustik Indie Senja',
    tanggal_event: '2026-10-25',
    pembeli_id: '081355512345',
    nama_pembeli: 'Nadia Putri',
    harga_tiket: 50000,
    jumlah_tiket: 3,
    total: 150000,
    status: 'hadir',
  },
];

type FilterTab = 'semua' | TiketStatus;

export default function TiketPage() {
  const [tiketList, setTiketList] = useState<TiketItem[]>(INITIAL_MOCK_TIKET);
  const [activeTab, setActiveTab] = useState<FilterTab>('semua');
  const [viewState, setViewState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredTiket = useMemo(() => {
    if (activeTab === 'semua') return tiketList;
    return tiketList.filter((t) => t.status === activeTab);
  }, [tiketList, activeTab]);

  const updateStatus = (id: string, newStatus: TiketStatus) => {
    setTiketList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    const label = STATUS_LABELS[newStatus]?.label || newStatus;
    setToastMessage(`Status tiket berhasil diubah menjadi ${label}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Modul Tiket
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              Koleksi: tiket
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pencatatan pembelian tiket, total harga, pelunasan transfer, dan check-in kehadiran.
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
            Normal ({tiketList.length})
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

      {/* Tabs Filter Status */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {(['semua', 'menunggu_bayar', 'lunas', 'hadir', 'dibatalkan'] as FilterTab[]).map((tab) => {
          const count =
            tab === 'semua'
              ? tiketList.length
              : tiketList.filter((t) => t.status === tab).length;
          const label = tab === 'semua' ? 'Semua Status' : STATUS_LABELS[tab]?.label;
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* State Handler */}
      {viewState === 'loading' && <LoadingState count={3} />}

      {viewState === 'error' && (
        <ErrorState
          title="Gagal Memuat Daftar Tiket"
          message="Tidak dapat membaca transaksi tiket dari sistem. Silakan ulangi kembali."
          onRetry={() => {
            setViewState('normal');
            setToastMessage('Berhasil memuat ulang data tiket');
          }}
        />
      )}

      {viewState === 'empty' && (
        <EmptyState
          icon={<Ticket className="w-7 h-7" />}
          title="Belum ada transaksi tiket"
          description="Belum ada tiket yang diterbitkan untuk pembeli. Klik tombol di bawah untuk mencatat pembelian baru."
          actionLabel="Catat Tiket Baru"
          onAction={() => {
            setViewState('normal');
            setToastMessage('Formulir Tambah Tiket akan aktif di Part 4');
          }}
        />
      )}

      {viewState === 'normal' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Daftar Tiket ({filteredTiket.length})
            </span>
            <button
              onClick={() => setToastMessage('Formulir Tambah Tiket lengkap akan diimplementasikan di Part 4')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Tiket</span>
            </button>
          </div>

          {filteredTiket.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Tidak ada tiket dengan status yang dipilih.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredTiket.map((t) => {
                const statusMeta = STATUS_LABELS[t.status];

                return (
                  <div
                    key={t.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                        >
                          {statusMeta.label}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          #{t.id}
                        </span>
                      </div>

                      <div>
                        <h2 className="font-semibold text-slate-900 text-base">
                          {t.nama_event}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700">
                            👤 {t.nama_pembeli} ({t.pembeli_id})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {t.tanggal_event}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 pt-1">
                        <span>
                          Jumlah: <strong>{t.jumlah_tiket} tiket</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Harga: {formatRupiah(t.harga_tiket)} / tiket
                        </span>
                        <span>•</span>
                        <span className="font-bold text-indigo-700">
                          Total: {formatRupiah(t.total)}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Perubahan Status Sesuai PRD Bagian 4 & 5 */}
                    <div className="flex sm:flex-col items-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                      {t.status === 'menunggu_bayar' && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => updateStatus(t.id, 'lunas')}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Konfirmasi Lunas</span>
                          </button>
                          <button
                            onClick={() => setConfirmCancelId(t.id)}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Batalkan</span>
                          </button>
                        </div>
                      )}

                      {t.status === 'lunas' && (
                        <button
                          onClick={() => updateStatus(t.id, 'hadir')}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Check-in Hadir</span>
                        </button>
                      )}

                      {t.status === 'hadir' && (
                        <span className="text-xs font-medium text-sky-700 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
                          Peserta telah check-in
                        </span>
                      )}

                      {t.status === 'dibatalkan' && (
                        <span className="text-xs font-medium text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          Tiket dibatalkan (kuota kembali)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dialog Konfirmasi Pembatalan Tiket */}
      <ConfirmDialog
        isOpen={Boolean(confirmCancelId)}
        title="Batalkan Pembelian Tiket?"
        message="Tiket yang dibatalkan tidak dapat diaktifkan kembali. Kuota event akan secara otomatis dikembalikan."
        confirmLabel="Ya, Batalkan Tiket"
        cancelLabel="Batal"
        isDangerous={true}
        onConfirm={() => {
          if (confirmCancelId) {
            updateStatus(confirmCancelId, 'dibatalkan');
            setConfirmCancelId(null);
          }
        }}
        onCancel={() => setConfirmCancelId(null)}
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

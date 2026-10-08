'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, Plus, CheckCircle, XCircle, UserCheck, Calendar, Clock, AlertCircle } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toast } from '@/components/ui/Toast';
import { TiketFormModal } from '@/components/tiket/TiketFormModal';
import { TiketItem, TiketStatus, STATUS_LABELS, EventItem, PembeliItem } from '@/types/firestore';
import { TiketService, EventService, PembeliService } from '@/lib/firestore-service';

type FilterTab = 'semua' | TiketStatus;

export default function TiketPage() {
  const [tiketList, setTiketList] = useState<TiketItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [pembeliList, setPembeliList] = useState<PembeliItem[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('semua');
  const [viewState, setViewState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // Ambil data live dari Cloud Firestore
  const loadData = async () => {
    setViewState('loading');
    try {
      const [fetchedTiket, fetchedEvents, fetchedPembeli] = await Promise.all([
        TiketService.getAll(),
        EventService.getAll(),
        PembeliService.getAll(),
      ]);

      setTiketList(fetchedTiket);
      setEvents(fetchedEvents);
      setPembeliList(fetchedPembeli);

      if (fetchedTiket.length === 0) {
        setViewState('empty');
      } else {
        setViewState('normal');
      }
    } catch (err: any) {
      console.error('Error fetching tiket data:', err);
      setViewState('error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filter tab status
  const filteredTiket = useMemo(() => {
    if (activeTab === 'semua') return tiketList;
    return tiketList.filter((t) => t.status === activeTab);
  }, [tiketList, activeTab]);

  // Handler Buat Tiket Baru di Firestore
  const handleCreateTiket = async (params: {
    eventId: string;
    pembeliId: string;
    jumlahTiket: number;
  }) => {
    try {
      await TiketService.create(params);
      setToastType('success');
      setToastMessage('Pemesanan tiket berhasil dicatat!');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err.message || 'Gagal membuat tiket');
      return false;
    }
  };

  // Handler Update Status Tiket Sesuai PRD Bagian 4 & 5
  const handleUpdateStatus = async (id: string, newStatus: TiketStatus) => {
    try {
      await TiketService.updateStatus(id, newStatus);
      const label = STATUS_LABELS[newStatus]?.label || newStatus;
      setToastType('success');
      if (newStatus === 'dibatalkan') {
        setToastMessage('Tiket dibatalkan dan kuota acara berhasil dikembalikan di Firestore');
      } else {
        setToastMessage(`Status tiket berhasil diubah menjadi ${label}`);
      }
      await loadData();
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err.message || 'Gagal mengubah status tiket');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Kelola Tiket
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pencatatan pemesanan tiket, verifikasi pembayaran, dan presensi kehadiran peserta.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Tiket Baru</span>
        </button>
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

      {/* Konten Berdasarkan State */}
      {viewState === 'loading' && <LoadingState count={3} />}

      {viewState === 'error' && (
        <ErrorState
          title="Gagal Memuat Daftar Tiket"
          message="Terjadi kendala saat memuat data tiket. Silakan periksa koneksi internet Anda."
          onRetry={loadData}
        />
      )}

      {viewState !== 'loading' && viewState !== 'error' && tiketList.length === 0 && (
        <EmptyState
          icon={<Ticket className="w-7 h-7" />}
          title="Belum Ada Tiket"
          description="Belum ada transaksi tiket yang tercatat. Klik tombol di atas untuk mencatat pesanan tiket baru."
          actionLabel="Catat Tiket Baru"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {viewState !== 'loading' && viewState !== 'error' && tiketList.length > 0 && (
        <div className="space-y-4">
          {filteredTiket.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
              <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                Tidak ada tiket dengan status &quot;{activeTab === 'semua' ? 'Semua' : STATUS_LABELS[activeTab]?.label}&quot;
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Pilih tab status lainnya atau catat tiket baru
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredTiket.map((t) => {
                const statusMeta = STATUS_LABELS[t.status];

                return (
                  <div
                    key={t.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      {/* Status Badge & ID */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                        >
                          {statusMeta.label}
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          #{t.id}
                        </span>
                      </div>

                      {/* Event & Pembeli Information */}
                      <div>
                        <h2 className="font-bold text-slate-900 text-base leading-snug">
                          {t.nama_event}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1">
                          <span className="font-medium text-slate-800 flex items-center gap-1">
                            👤 {t.nama_pembeli}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-500">
                            WA: {t.pembeli_id}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {t.tanggal_event}
                          </span>
                        </div>
                      </div>

                      {/* Rincian Harga & Jumlah (Snapshot) */}
                      <div className="p-3 bg-slate-50 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Harga Snapshot</span>
                          <span className="font-semibold text-slate-800">{formatRupiah(t.harga_tiket)} / lembar</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Jumlah</span>
                          <span className="font-bold text-indigo-700">{t.jumlah_tiket} lembar</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Bayar</span>
                          <span className="font-extrabold text-sm text-indigo-700">{formatRupiah(t.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tombol Perubahan Status Sesuai PRD Bagian 4 & 5 */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                      {t.status === 'menunggu_bayar' && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'lunas')}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Konfirmasi Lunas</span>
                          </button>
                          <button
                            onClick={() => setConfirmCancelId(t.id)}
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Batalkan</span>
                          </button>
                        </div>
                      )}

                      {t.status === 'lunas' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'hadir')}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Check-in Hadir</span>
                        </button>
                      )}

                      {t.status === 'hadir' && (
                        <span className="text-xs font-bold text-sky-700 flex items-center gap-1.5 py-1">
                          <CheckCircle className="w-4 h-4 text-sky-600" />
                          Peserta telah hadir di acara
                        </span>
                      )}

                      {t.status === 'dibatalkan' && (
                        <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5 py-1">
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                          Tiket dibatalkan (kuota dikembalikan)
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

      {/* Modal Formulir Catat Tiket */}
      <TiketFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        events={events}
        pembeliList={pembeliList}
        onSubmit={handleCreateTiket}
      />

      {/* Dialog Konfirmasi Pembatalan Tiket */}
      <ConfirmDialog
        isOpen={Boolean(confirmCancelId)}
        title="Batalkan Tiket Ini?"
        message="Pembelian tiket yang dibatalkan tidak dapat diaktifkan kembali. Kuota event di Firestore akan otomatis dikembalikan ke acara."
        confirmLabel="Ya, Batalkan Tiket"
        cancelLabel="Kembali"
        isDangerous={true}
        onConfirm={() => {
          if (confirmCancelId) {
            handleUpdateStatus(confirmCancelId, 'dibatalkan');
            setConfirmCancelId(null);
          }
        }}
        onCancel={() => setConfirmCancelId(null)}
      />

      {/* Notifikasi Toast */}
      <Toast
        message={toastMessage || ''}
        type={toastType}
        isVisible={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}

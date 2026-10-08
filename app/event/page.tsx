'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, MapPin, Users, Edit3, Trash2 } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toast } from '@/components/ui/Toast';
import { EventFormModal } from '@/components/event/EventFormModal';
import { EventItem } from '@/types/firestore';
import { EventService } from '@/lib/firestore-service';

export default function EventPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [viewState, setViewState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ambil data dari Firestore
  const loadEvents = async () => {
    setViewState('loading');
    try {
      const data = await EventService.getAll();
      setEvents(data);
      if (data.length === 0) {
        setViewState('empty');
      } else {
        setViewState('normal');
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setViewState('error');
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Handler Buka Form Tambah
  const handleOpenAdd = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  // Handler Buka Form Edit
  const handleOpenEdit = (event: EventItem) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  // Handler Simpan (Create atau Update ke Firestore)
  const handleSaveEvent = async (savedData: Omit<EventItem, 'id'> & { id?: string }) => {
    setIsSubmitting(true);
    try {
      if (savedData.id) {
        // Update Firestore
        await EventService.update(savedData.id, {
          nama: savedData.nama,
          tanggal: savedData.tanggal,
          lokasi: savedData.lokasi,
          harga_tiket: savedData.harga_tiket,
          kuota: savedData.kuota,
        });
        setToastType('success');
        setToastMessage(`Data event "${savedData.nama}" berhasil diperbarui di Firestore`);
      } else {
        // Create Firestore
        await EventService.create({
          nama: savedData.nama,
          tanggal: savedData.tanggal,
          lokasi: savedData.lokasi,
          harga_tiket: savedData.harga_tiket,
          kuota: savedData.kuota,
        });
        setToastType('success');
        setToastMessage(`Event "${savedData.nama}" berhasil disimpan ke Firestore`);
      }
      setIsModalOpen(false);
      setEditingEvent(null);
      await loadEvents();
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err.message || 'Gagal menyimpan data event ke Firestore');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Hapus Event dari Firestore
  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    const target = events.find((e) => e.id === confirmDeleteId);
    try {
      await EventService.delete(confirmDeleteId);
      setConfirmDeleteId(null);
      setToastType('success');
      setToastMessage(`Event "${target?.nama || ''}" berhasil dihapus dari Firestore`);
      await loadEvents();
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err.message || 'Gagal menghapus event');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Modul Event
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              Live Firestore: event
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Mengelola data acara, tanggal, lokasi, harga tiket, kuota, dan sisa kursi tersedia di Cloud Firestore.
          </p>
        </div>

        {/* Demo Switcher State (Uji 3 State) */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl text-xs font-medium self-start sm:self-auto border border-slate-300/60">
          <button
            onClick={() => setViewState('normal')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewState === 'normal'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Normal ({events.length})
          </button>
          <button
            onClick={() => setViewState('loading')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewState === 'loading'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Loading
          </button>
          <button
            onClick={() => setViewState('empty')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewState === 'empty'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Empty
          </button>
          <button
            onClick={() => setViewState('error')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewState === 'error'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Error
          </button>
        </div>
      </div>

      {/* Konten Berdasarkan State */}
      {viewState === 'loading' && <LoadingState count={3} />}

      {viewState === 'error' && (
        <ErrorState
          title="Gagal Memuat Daftar Event"
          message="Koneksi terputus saat membaca data event dari Firestore. Silakan periksa jaringan Anda."
          onRetry={loadEvents}
        />
      )}

      {viewState === 'empty' && (
        <EmptyState
          icon={<Calendar className="w-7 h-7" />}
          title="Belum ada event"
          description="Belum ada acara yang terdaftar di database Firestore. Mulai buat acara pertama untuk menjual tiket."
          actionLabel="Tambah Event"
          onAction={handleOpenAdd}
        />
      )}

      {viewState === 'normal' && (
        <div className="space-y-4">
          {/* Bar Aksi Utama */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Daftar Acara ({events.length})
            </span>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Event</span>
            </button>
          </div>

          {events.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-7 h-7" />}
              title="Belum ada event"
              description="Belum ada acara yang terdaftar di Firestore. Mulai buat acara pertama untuk menjual tiket."
              actionLabel="Tambah Event"
              onAction={handleOpenAdd}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {events.map((ev) => {
                const sisaKuota = Math.max(0, ev.kuota - (ev.tiket_terjual || 0));
                const isHabis = (ev.tiket_terjual || 0) >= ev.kuota;

                return (
                  <div
                    key={ev.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-2.5">
                      {/* Judul & Badge Kuota */}
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                          {ev.nama}
                        </h2>
                        {isHabis ? (
                          <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Habis
                          </span>
                        ) : (
                          <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Sisa {sisaKuota} Kursi
                          </span>
                        )}
                      </div>

                      {/* Detail Informasi */}
                      <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{ev.tanggal}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{ev.lokasi}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>
                            Terjual: <strong>{ev.tiket_terjual || 0}</strong> / {ev.kuota} kursi
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Kartu: Harga & Tombol CRUD */}
                    <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                          Harga Tiket
                        </span>
                        <span className="text-sm font-extrabold text-indigo-700">
                          {ev.harga_tiket === 0 ? 'Gratis' : formatRupiah(ev.harga_tiket)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(ev)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          title="Ubah data event"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Ubah</span>
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(ev.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Formulir Tambah/Ubah Event */}
      <EventFormModal
        isOpen={isModalOpen}
        initialData={editingEvent}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
      />

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteId)}
        title="Hapus Event Ini?"
        message="Event yang dihapus dari Firestore tidak dapat dipulihkan. Pastikan tidak ada tiket aktif yang terkait dengan acara ini."
        confirmLabel="Hapus Event"
        cancelLabel="Batal"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
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

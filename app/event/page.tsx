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
        setToastMessage(`Acara "${savedData.nama}" berhasil diperbarui`);
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
        setToastMessage(`Acara "${savedData.nama}" berhasil ditambahkan`);
      }
      setIsModalOpen(false);
      setEditingEvent(null);
      await loadEvents();
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err.message || 'Gagal menyimpan data acara');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Hapus Event
  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    const target = events.find((e) => e.id === confirmDeleteId);
    try {
      await EventService.delete(confirmDeleteId);
      setConfirmDeleteId(null);
      setToastType('success');
      setToastMessage(`Acara "${target?.nama || ''}" berhasil dihapus`);
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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Daftar Acara
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola jadwal acara, kapasitas kuota tiket, dan harga penjualan.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Acara</span>
        </button>
      </div>

      {/* Konten Berdasarkan State */}
      {viewState === 'loading' && <LoadingState count={3} />}

      {viewState === 'error' && (
        <ErrorState
          title="Gagal Memuat Acara"
          message="Terjadi kendala saat memuat data acara. Silakan periksa koneksi internet Anda."
          onRetry={loadEvents}
        />
      )}

      {viewState !== 'loading' && viewState !== 'error' && events.length === 0 && (
        <EmptyState
          icon={<Calendar className="w-7 h-7" />}
          title="Belum Ada Acara"
          description="Belum ada acara yang terdaftar. Buat acara pertama untuk mulai membuka penjualan tiket."
          actionLabel="Tambah Acara"
          onAction={handleOpenAdd}
        />
      )}

      {viewState !== 'loading' && viewState !== 'error' && events.length > 0 && (
        <div className="space-y-4">
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
                        <h2 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-900 transition-colors">
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
                        <span className="text-sm font-extrabold text-blue-800">
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

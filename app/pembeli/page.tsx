'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Search, Phone, Mail, Edit3, Trash2, UserPlus } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toast } from '@/components/ui/Toast';
import { PembeliFormModal } from '@/components/pembeli/PembeliFormModal';
import { PembeliItem } from '@/types/firestore';
import { PembeliService } from '@/lib/firestore-service';

export default function PembeliPage() {
  const [pembeliList, setPembeliList] = useState<PembeliItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewState, setViewState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPembeli, setEditingPembeli] = useState<PembeliItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Ambil data pembeli dari Firestore
  const loadPembeli = async () => {
    setViewState('loading');
    try {
      const data = await PembeliService.getAll();
      setPembeliList(data);
      if (data.length === 0) {
        setViewState('empty');
      } else {
        setViewState('normal');
      }
    } catch (err: any) {
      console.error('Error fetching pembeli:', err);
      setViewState('error');
    }
  };

  useEffect(() => {
    loadPembeli();
  }, []);

  // Daftar nomor WA yang sudah terdaftar
  const existingPhones = useMemo(() => {
    return pembeliList.map((p) => p.no_whatsapp);
  }, [pembeliList]);

  // Acceptance Criteria 4: Filter pencarian realtime berdasarkan nama atau no_whatsapp
  const filteredPembeli = useMemo(() => {
    if (!searchQuery.trim()) return pembeliList;
    const q = searchQuery.toLowerCase();
    return pembeliList.filter(
      (p) => p.nama.toLowerCase().includes(q) || p.no_whatsapp.includes(q)
    );
  }, [pembeliList, searchQuery]);

  // Handler Buka Tambah
  const handleOpenAdd = () => {
    setEditingPembeli(null);
    setIsModalOpen(true);
  };

  // Handler Buka Edit
  const handleOpenEdit = (pembeli: PembeliItem) => {
    setEditingPembeli(pembeli);
    setIsModalOpen(true);
  };

  // Handler Simpan Data Pembeli ke Firestore
  const handleSavePembeli = async (pembeliData: Omit<PembeliItem, 'dibuat_pada'>) => {
    try {
      if (editingPembeli) {
        // Mode Edit Firestore: Update nama & email
        await PembeliService.update(pembeliData.no_whatsapp, {
          nama: pembeliData.nama,
          email: pembeliData.email,
        });
        setToastType('success');
        setToastMessage(`Data pembeli "${pembeliData.nama}" berhasil diperbarui`);
      } else {
        // Mode Tambah Firestore: Cek getDoc duplikat lalu setDoc
        await PembeliService.create({
          nama: pembeliData.nama,
          no_whatsapp: pembeliData.no_whatsapp,
          email: pembeliData.email,
        });
        setToastType('success');
        setToastMessage(`Pembeli "${pembeliData.nama}" berhasil didaftarkan`);
      }

      setIsModalOpen(false);
      setEditingPembeli(null);
      await loadPembeli();
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err.message || 'Gagal menyimpan data pembeli');
      return false;
    }
  };

  // Handler Hapus Pembeli
  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    const target = pembeliList.find((p) => p.id === confirmDeleteId);
    try {
      await PembeliService.delete(confirmDeleteId);
      setConfirmDeleteId(null);
      setToastType('success');
      setToastMessage(`Pembeli "${target?.nama || ''}" berhasil dihapus`);
      await loadPembeli();
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err.message || 'Gagal menghapus pembeli');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Data Pembeli
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola kontak dan informasi pembeli tiket acara.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pembeli</span>
        </button>
      </div>

      {/* Konten Berdasarkan State */}
      {viewState === 'loading' && <LoadingState count={3} type="table" />}

      {viewState === 'error' && (
        <ErrorState
          title="Gagal Memuat Data Pembeli"
          message="Terjadi kendala saat memuat data pembeli. Silakan periksa koneksi internet Anda."
          onRetry={loadPembeli}
        />
      )}

      {viewState !== 'loading' && viewState !== 'error' && pembeliList.length === 0 && (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title="Belum Ada Pembeli"
          description="Data pembeli belum tercatat. Tambahkan pembeli baru untuk mulai memproses pesanan tiket."
          actionLabel="Tambah Pembeli"
          onAction={handleOpenAdd}
        />
      )}

      {viewState !== 'loading' && viewState !== 'error' && pembeliList.length > 0 && (
        <div className="space-y-4">
          {/* Bar Atas: Pencarian */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pembeli berdasarkan nama atau no WhatsApp..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 shadow-xs placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Daftar Pembeli */}
          {filteredPembeli.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                {searchQuery
                  ? `Tidak ada pembeli dengan kata kunci "${searchQuery}"`
                  : 'Belum ada data pembeli di Firestore'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? 'Periksa kembali ejaan nama atau nomor WhatsApp'
                  : 'Gunakan tombol Tambah Pembeli untuk memasukkan data'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs divide-y divide-slate-100">
              {filteredPembeli.map((p) => (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-slate-900 text-base group-hover:text-blue-900 transition-colors">
                        {p.nama}
                      </h2>
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                        ID: {p.no_whatsapp}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-blue-700" />
                        <span>{p.no_whatsapp}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.email}</span>
                      </span>
                    </div>
                  </div>

                  {/* Tombol Aksi Ubah & Hapus */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Ubah data pembeli"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Ubah</span>
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(p.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus data pembeli"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Formulir Tambah/Ubah Pembeli */}
      <PembeliFormModal
        isOpen={isModalOpen}
        initialData={editingPembeli}
        existingPhones={existingPhones}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPembeli(null);
        }}
        onSave={handleSavePembeli}
      />

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteId)}
        title="Hapus Pembeli Ini?"
        message="Data pembeli akan dihapus secara permanen. Pastikan pembeli ini tidak memiliki transaksi tiket aktif."
        confirmLabel="Hapus Pembeli"
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

'use client';

import React, { useState, useMemo } from 'react';
import { Users, Plus, Search, Phone, Mail, Edit3, Trash2, UserPlus } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toast } from '@/components/ui/Toast';
import { PembeliFormModal } from '@/components/pembeli/PembeliFormModal';
import { PembeliItem } from '@/types/firestore';

// Data contoh awal dari Skema Firestore Bab 4
const INITIAL_MOCK_PEMBELI: PembeliItem[] = [
  {
    id: '081355512345',
    nama: 'Nadia Putri',
    no_whatsapp: '081355512345',
    email: 'nadia.putri@contoh.id',
  },
  {
    id: '081298765432',
    nama: 'Budi Pratama',
    no_whatsapp: '081298765432',
    email: 'budi.pratama@mail.com',
  },
];

export default function PembeliPage() {
  const [pembeliList, setPembeliList] = useState<PembeliItem[]>(INITIAL_MOCK_PEMBELI);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewState, setViewState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPembeli, setEditingPembeli] = useState<PembeliItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Daftar nomor WA yang sudah terdaftar untuk cek duplikasi
  const existingPhones = useMemo(() => {
    return pembeliList.map((p) => p.no_whatsapp);
  }, [pembeliList]);

  // Acceptance Criteria 4: Filter pencarian berdasarkan nama atau no_whatsapp
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

  // Handler Simpan Data Pembeli
  const handleSavePembeli = (pembeliData: Omit<PembeliItem, 'dibuat_pada'>) => {
    if (editingPembeli) {
      // Mode Edit: Update nama dan email (no_whatsapp tetap sama sebagai ID)
      setPembeliList((prev) =>
        prev.map((item) =>
          item.id === editingPembeli.id
            ? { ...item, nama: pembeliData.nama, email: pembeliData.email }
            : item
        )
      );
      setToastType('success');
      setToastMessage(`Data pembeli "${pembeliData.nama}" berhasil diperbarui`);
    } else {
      // Mode Tambah: Acceptance criteria 2 (cek no_whatsapp sudah ada)
      if (existingPhones.includes(pembeliData.no_whatsapp)) {
        setToastType('error');
        setToastMessage('Nomor WhatsApp sudah terdaftar');
        return false;
      }

      const newPembeli: PembeliItem = {
        id: pembeliData.no_whatsapp,
        no_whatsapp: pembeliData.no_whatsapp,
        nama: pembeliData.nama,
        email: pembeliData.email,
      };

      setPembeliList((prev) => [newPembeli, ...prev]);
      setToastType('success');
      setToastMessage(`Pembeli "${pembeliData.nama}" berhasil didaftarkan`);
    }

    setIsModalOpen(false);
    setEditingPembeli(null);
    if (viewState === 'empty') setViewState('normal');
  };

  // Handler Hapus Pembeli (Acceptance criteria 5)
  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return;
    const target = pembeliList.find((p) => p.id === confirmDeleteId);
    setPembeliList((prev) => prev.filter((item) => item.id !== confirmDeleteId));
    setConfirmDeleteId(null);
    setToastType('success');
    setToastMessage(`Pembeli "${target?.nama || ''}" berhasil dihapus`);
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Modul Pembeli
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs">
              Koleksi: pembeli
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Mengelola data nama, nomor WhatsApp (ID dokumen unik), dan email pembeli tiket.
          </p>
        </div>

        {/* Demo Switcher State */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl text-xs font-medium self-start sm:self-auto border border-slate-300/60">
          <button
            onClick={() => setViewState('normal')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewState === 'normal'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Normal ({pembeliList.length})
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
      {viewState === 'loading' && <LoadingState count={3} type="table" />}

      {viewState === 'error' && (
        <ErrorState
          title="Gagal Memuat Data Pembeli"
          message="Tidak dapat membaca data pembeli dari sistem. Silakan periksa koneksi internet."
          onRetry={() => {
            setViewState('normal');
            setToastType('info');
            setToastMessage('Berhasil memuat ulang data pembeli');
          }}
        />
      )}

      {viewState === 'empty' && (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title="Belum ada pembeli"
          description="Data pembeli belum tercatat di sistem. Tambahkan data pembeli baru untuk mulai memesan tiket."
          actionLabel="Tambah Pembeli"
          onAction={handleOpenAdd}
        />
      )}

      {viewState === 'normal' && (
        <div className="space-y-4">
          {/* Bar Atas: Pencarian & Tombol Tambah */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Kolom Cari Real-Time (Acceptance Criteria 4) */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pembeli berdasarkan nama atau no WhatsApp..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs placeholder:text-slate-400 transition-all"
              />
            </div>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pembeli</span>
            </button>
          </div>

          {/* Daftar Pembeli */}
          {filteredPembeli.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                {searchQuery
                  ? `Tidak ada pembeli dengan kata kunci "${searchQuery}"`
                  : 'Belum ada data pembeli terdaftar'}
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
                      <h2 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                        {p.nama}
                      </h2>
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                        ID: {p.no_whatsapp}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-indigo-500" />
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Ubah data pembeli"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Ubah</span>
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(p.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors"
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
        message="Data pembeli akan dihapus dari sistem. Pastikan pembeli ini tidak memiliki tiket aktif yang belum diselesaikan."
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

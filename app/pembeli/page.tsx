'use client';

import React, { useState, useMemo } from 'react';
import { Users, Plus, Search, Phone, Mail } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toast } from '@/components/ui/Toast';
import { PembeliItem } from '@/types/firestore';

// Data contoh dari Skema Firestore Bab 4
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter pencarian berdasarkan nama atau no_whatsapp
  const filteredPembeli = useMemo(() => {
    if (!searchQuery.trim()) return pembeliList;
    const q = searchQuery.toLowerCase();
    return pembeliList.filter(
      (p) => p.nama.toLowerCase().includes(q) || p.no_whatsapp.includes(q)
    );
  }, [pembeliList, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Modul Pembeli
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              Koleksi: pembeli
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data nama, nomor WhatsApp (sebagai ID unik), dan email pembeli tiket.
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
            Normal ({pembeliList.length})
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

      {/* Kolom Pencarian */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari pembeli berdasarkan nama atau nomor WhatsApp..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs placeholder:text-slate-400"
        />
      </div>

      {/* State Handler */}
      {viewState === 'loading' && <LoadingState count={2} type="table" />}

      {viewState === 'error' && (
        <ErrorState
          title="Gagal Memuat Data Pembeli"
          message="Tidak dapat mengambil data pembeli. Silakan periksa koneksi internet."
          onRetry={() => {
            setViewState('normal');
            setToastMessage('Berhasil memuat ulang data pembeli');
          }}
        />
      )}

      {viewState === 'empty' && (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title="Belum ada pembeli"
          description="Data pembeli belum tercatat. Tambahkan pembeli baru untuk mulai memesan tiket."
          actionLabel="Tambah Pembeli"
          onAction={() => {
            setViewState('normal');
            setToastMessage('Formulir Tambah Pembeli akan aktif di Part 3');
          }}
        />
      )}

      {viewState === 'normal' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Daftar Pembeli Terdaftar ({filteredPembeli.length})
            </span>
            <button
              onClick={() => setToastMessage('Fitur Tambah Pembeli akan lengkap di Part 3')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pembeli</span>
            </button>
          </div>

          {filteredPembeli.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Tidak ada pembeli yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
              {filteredPembeli.map((p) => (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1">
                    <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
                      {p.nama}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-mono text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {p.no_whatsapp}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {p.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0">
                    <button
                      onClick={() => setToastMessage(`Ubah pembeli: ${p.nama} (Akan lengkap di Part 3)`)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Ubah
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(p.id)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteId)}
        title="Hapus Pembeli?"
        message="Data pembeli ini akan dihapus dari sistem. Pastikan pembeli tidak memiliki tiket aktif yang belum selesai."
        confirmLabel="Hapus Pembeli"
        cancelLabel="Batal"
        isDangerous={true}
        onConfirm={() => {
          setPembeliList((prev) => prev.filter((item) => item.id !== confirmDeleteId));
          setConfirmDeleteId(null);
          setToastMessage('Pembeli berhasil dihapus');
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

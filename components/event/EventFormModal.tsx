'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Tag, Users, AlertCircle } from 'lucide-react';
import { EventItem } from '@/types/firestore';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<EventItem, 'id'> & { id?: string }) => void;
  initialData?: EventItem | null;
}

interface FormErrors {
  nama?: string;
  tanggal?: string;
  lokasi?: string;
  harga_tiket?: string;
  kuota?: string;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    nama: '',
    tanggal: '',
    lokasi: '',
    harga_tiket: '',
    kuota: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nama: initialData.nama || '',
        tanggal: initialData.tanggal || '',
        lokasi: initialData.lokasi || '',
        harga_tiket: String(initialData.harga_tiket ?? 0),
        kuota: String(initialData.kuota ?? 1),
      });
    } else {
      // Default tanggal: hari ini atau tanggal terdekat
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        nama: '',
        tanggal: today,
        lokasi: '',
        harga_tiket: '50000',
        kuota: '50',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Validasi Nama: 1 - 60 karakter
    const namaTrim = formData.nama.trim();
    if (!namaTrim) {
      newErrors.nama = 'Nama event wajib diisi';
    } else if (namaTrim.length > 60) {
      newErrors.nama = 'Nama event maksimal 60 karakter';
    }

    // 2. Validasi Tanggal: format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!formData.tanggal) {
      newErrors.tanggal = 'Tanggal event wajib diisi';
    } else if (!dateRegex.test(formData.tanggal)) {
      newErrors.tanggal = 'Format tanggal harus YYYY-MM-DD';
    }

    // 3. Validasi Lokasi: 1 - 100 karakter
    const lokasiTrim = formData.lokasi.trim();
    if (!lokasiTrim) {
      newErrors.lokasi = 'Lokasi event wajib diisi';
    } else if (lokasiTrim.length > 100) {
      newErrors.lokasi = 'Lokasi event maksimal 100 karakter';
    }

    // 4. Validasi Harga Tiket: angka bulat minimal 0 (0 = gratis)
    const hargaNum = Number(formData.harga_tiket);
    if (formData.harga_tiket === '' || isNaN(hargaNum)) {
      newErrors.harga_tiket = 'Harga tiket harus berupa angka';
    } else if (!Number.isInteger(hargaNum)) {
      newErrors.harga_tiket = 'Harga tiket harus berupa bilangan bulat rupiah';
    } else if (hargaNum < 0) {
      newErrors.harga_tiket = 'Harga tiket tidak boleh negatif (minimal 0)';
    }

    // 5. Validasi Kuota: 1 sampai 500, dan jika edit tidak boleh < tiket_terjual
    const kuotaNum = Number(formData.kuota);
    if (formData.kuota === '' || isNaN(kuotaNum)) {
      newErrors.kuota = 'Kuota kursi harus berupa angka';
    } else if (!Number.isInteger(kuotaNum)) {
      newErrors.kuota = 'Kuota harus berupa bilangan bulat';
    } else if (kuotaNum < 1 || kuotaNum > 500) {
      newErrors.kuota = 'Kuota harus antara 1 sampai 500 kursi';
    } else if (isEditing && initialData && kuotaNum < initialData.tiket_terjual) {
      // Acceptance Criteria 4
      newErrors.kuota = `Kuota tidak boleh lebih kecil dari tiket yang sudah terjual (${initialData.tiket_terjual} tiket)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...(initialData?.id ? { id: initialData.id } : {}),
      nama: formData.nama.trim(),
      tanggal: formData.tanggal,
      lokasi: formData.lokasi.trim(),
      harga_tiket: Math.floor(Number(formData.harga_tiket)),
      kuota: Math.floor(Number(formData.kuota)),
      tiket_terjual: initialData ? initialData.tiket_terjual : 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Ubah Data Event' : 'Tambah Event Baru'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Perbarui detail informasi acara dan kuota kursi'
                : 'Isi informasi acara untuk mulai menjual tiket'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Formulir */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto flex-1">
          {/* Field 1: Nama Event */}
          <div className="space-y-1.5">
            <label htmlFor="nama" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Nama Event <span className="text-rose-500">*</span>
            </label>
            <input
              id="nama"
              type="text"
              maxLength={60}
              placeholder="Contoh: Workshop Sablon Tote Bag"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                errors.nama
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-200 focus:ring-blue-700 focus:border-blue-700'
              }`}
            />
            <div className="flex justify-between items-center text-[11px]">
              {errors.nama ? (
                <span className="text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.nama}
                </span>
              ) : (
                <span className="text-slate-400">1 sampai 60 karakter</span>
              )}
              <span className="text-slate-400 ml-auto">{formData.nama.length}/60</span>
            </div>
          </div>

          {/* Field 2: Tanggal Event */}
          <div className="space-y-1.5">
            <label htmlFor="tanggal" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Tanggal Event <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  errors.tanggal
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-200 focus:ring-blue-700 focus:border-blue-700'
                }`}
              />
            </div>
            {errors.tanggal && (
              <p className="text-rose-600 text-[11px] flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.tanggal}
              </p>
            )}
          </div>

          {/* Field 3: Lokasi Event */}
          <div className="space-y-1.5">
            <label htmlFor="lokasi" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Lokasi Event <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="lokasi"
                type="text"
                maxLength={100}
                placeholder="Contoh: Ruang Karsa, Jl. Merdeka No. 21"
                value={formData.lokasi}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  errors.lokasi
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-200 focus:ring-blue-700 focus:border-blue-700'
                }`}
              />
            </div>
            <div className="flex justify-between items-center text-[11px]">
              {errors.lokasi ? (
                <span className="text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.lokasi}
                </span>
              ) : (
                <span className="text-slate-400">Tempat acara, 1 sampai 100 karakter</span>
              )}
              <span className="text-slate-400 ml-auto">{formData.lokasi.length}/100</span>
            </div>
          </div>

          {/* Baris Dua Kolom: Harga Tiket & Kuota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field 4: Harga Tiket */}
            <div className="space-y-1.5">
              <label htmlFor="harga_tiket" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Harga Tiket (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  id="harga_tiket"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  value={formData.harga_tiket}
                  onChange={(e) => setFormData({ ...formData, harga_tiket: e.target.value })}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    errors.harga_tiket
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-200 focus:ring-blue-700 focus:border-blue-700'
                  }`}
                />
              </div>
              {errors.harga_tiket ? (
                <p className="text-rose-600 text-[11px] flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.harga_tiket}
                </p>
              ) : (
                <p className="text-slate-400 text-[11px]">Isi 0 jika acara gratis</p>
              )}
            </div>

            {/* Field 5: Kuota */}
            <div className="space-y-1.5">
              <label htmlFor="kuota" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Kuota Kursi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="kuota"
                  type="number"
                  min="1"
                  max="500"
                  placeholder="50"
                  value={formData.kuota}
                  onChange={(e) => setFormData({ ...formData, kuota: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    errors.kuota
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-200 focus:ring-blue-700 focus:border-blue-700'
                  }`}
                />
              </div>
              {errors.kuota ? (
                <p className="text-rose-600 text-[11px] flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.kuota}
                </p>
              ) : (
                <p className="text-slate-400 text-[11px]">Batas kuota 1 sampai 500 kursi</p>
              )}
            </div>
          </div>

          {/* Info Status Tiket Terjual Saat Edit */}
          {isEditing && initialData && (
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-center justify-between">
              <span>Tiket yang sudah terjual saat ini:</span>
              <span className="font-bold text-blue-800">{initialData.tiket_terjual} tiket</span>
            </div>
          )}

          {/* Modal Footer / Tombol Aksi */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isEditing ? 'Perbarui Event' : 'Simpan Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

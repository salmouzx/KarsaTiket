'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, AlertCircle } from 'lucide-react';
import { PembeliItem } from '@/types/firestore';

interface PembeliFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pembeliData: Omit<PembeliItem, 'dibuat_pada'>) => Promise<boolean | void> | boolean | void;
  initialData?: PembeliItem | null;
  existingPhones: string[]; // Daftar nomor WA yang sudah terdaftar untuk cek duplikasi
}

interface FormErrors {
  nama?: string;
  no_whatsapp?: string;
  email?: string;
}

export const PembeliFormModal: React.FC<PembeliFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingPhones,
}) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    nama: '',
    no_whatsapp: '',
    email: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nama: initialData.nama || '',
        no_whatsapp: initialData.no_whatsapp || '',
        email: initialData.email || '',
      });
    } else {
      setFormData({
        nama: '',
        no_whatsapp: '',
        email: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Validasi Nama: Wajib, 1 - 60 karakter
    const namaTrim = formData.nama.trim();
    if (!namaTrim) {
      newErrors.nama = 'Nama pembeli wajib diisi';
    } else if (namaTrim.length > 60) {
      newErrors.nama = 'Nama pembeli maksimal 60 karakter';
    }

    // 2. Validasi Nomor WhatsApp:
    // Diawali 08, total 10 sampai 13 angka
    const waTrim = formData.no_whatsapp.trim();
    const waRegex = /^08\d{8,11}$/;

    if (!waTrim) {
      newErrors.no_whatsapp = 'Nomor WhatsApp wajib diisi';
    } else if (!waRegex.test(waTrim)) {
      newErrors.no_whatsapp = 'Nomor WhatsApp harus diawali 08 dan berjumlah 10 sampai 13 digit angka';
    } else if (!isEditing && existingPhones.includes(waTrim)) {
      // Acceptance criteria 2: "Nomor WhatsApp sudah terdaftar"
      newErrors.no_whatsapp = 'Nomor WhatsApp sudah terdaftar';
    }

    // 3. Validasi Email:
    // Wajib mengandung tanda @, maksimal 80 karakter
    const emailTrim = formData.email.trim();
    if (!emailTrim) {
      newErrors.email = 'Email wajib diisi';
    } else if (!emailTrim.includes('@')) {
      // Acceptance criteria 3: Given email tanpa tanda @
      newErrors.email = 'Email harus mengandung tanda @';
    } else if (emailTrim.length > 80) {
      newErrors.email = 'Email maksimal 80 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const success = await onSave({
        id: formData.no_whatsapp.trim(),
        no_whatsapp: formData.no_whatsapp.trim(),
        nama: formData.nama.trim(),
        email: formData.email.trim(),
      });

      if (success !== false) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Ubah Data Pembeli' : 'Tambah Pembeli Baru'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Perbarui nama atau email pembeli'
                : 'Nomor WhatsApp akan digunakan sebagai ID unik pembeli'}
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
          {/* Field 1: Nama Pembeli */}
          <div className="space-y-1.5">
            <label htmlFor="pembeli-nama" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="pembeli-nama"
                type="text"
                maxLength={60}
                placeholder="Contoh: Nadia Putri"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  errors.nama
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-200 focus:ring-blue-700 focus:border-blue-700'
                }`}
              />
            </div>
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

          {/* Field 2: Nomor WhatsApp (ID Dokumen) */}
          <div className="space-y-1.5">
            <label htmlFor="pembeli-wa" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Nomor WhatsApp (ID) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="pembeli-wa"
                type="tel"
                disabled={isEditing}
                maxLength={13}
                placeholder="081355512345"
                value={formData.no_whatsapp}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    no_whatsapp: e.target.value.replace(/[^0-9]/g, ''),
                  })
                }
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 transition-all ${
                  isEditing
                    ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                    : errors.no_whatsapp
                    ? 'bg-slate-50 border-rose-400 focus:ring-rose-400 focus:bg-white'
                    : 'bg-slate-50 border-slate-200 focus:ring-blue-700 focus:border-blue-700 focus:bg-white'
                }`}
              />
            </div>
            {errors.no_whatsapp ? (
              <p className="text-rose-600 text-[11px] flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.no_whatsapp}
              </p>
            ) : isEditing ? (
              <p className="text-slate-400 text-[11px]">Nomor WhatsApp berfungsi sebagai ID unik dan tidak dapat diubah</p>
            ) : (
              <p className="text-slate-400 text-[11px]">Diawali 08, total 10 sampai 13 angka</p>
            )}
          </div>

          {/* Field 3: Email */}
          <div className="space-y-1.5">
            <label htmlFor="pembeli-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Alamat Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="pembeli-email"
                type="email"
                maxLength={80}
                placeholder="nadia.putri@contoh.id"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  errors.email
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-200 focus:ring-blue-700 focus:border-blue-700'
                }`}
              />
            </div>
            <div className="flex justify-between items-center text-[11px]">
              {errors.email ? (
                <span className="text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                </span>
              ) : (
                <span className="text-slate-400">Harus mengandung tanda @ (maks 80 karakter)</span>
              )}
              <span className="text-slate-400 ml-auto">{formData.email.length}/80</span>
            </div>
          </div>

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
              {isEditing ? 'Perbarui Pembeli' : 'Simpan Pembeli'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

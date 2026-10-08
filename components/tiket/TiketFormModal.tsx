'use client';

import React, { useState, useEffect } from 'react';
import { X, Ticket, Calendar, User, AlertCircle, Calculator } from 'lucide-react';
import { EventItem, PembeliItem } from '@/types/firestore';

interface TiketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  pembeliList: PembeliItem[];
  onSubmit: (params: { eventId: string; pembeliId: string; jumlahTiket: number }) => boolean | void;
}

export const TiketFormModal: React.FC<TiketFormModalProps> = ({
  isOpen,
  onClose,
  events,
  pembeliList,
  onSubmit,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedPembeliId, setSelectedPembeliId] = useState<string>('');
  const [jumlahTiket, setJumlahTiket] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Pilih event pertama yang masih ada kuotanya
      const availableEvent = events.find((e) => e.kuota - e.tiket_terjual > 0);
      setSelectedEventId(availableEvent ? availableEvent.id : (events[0]?.id || ''));
      setSelectedPembeliId(pembeliList[0]?.id || '');
      setJumlahTiket(1);
      setErrorMsg(null);
    }
  }, [isOpen, events, pembeliList]);

  if (!isOpen) return null;

  const currentEvent = events.find((e) => e.id === selectedEventId);
  const currentPembeli = pembeliList.find((p) => p.id === selectedPembeliId);
  const sisaKuota = currentEvent ? Math.max(0, currentEvent.kuota - currentEvent.tiket_terjual) : 0;
  const hargaTiket = currentEvent?.harga_tiket ?? 0;
  const totalHarga = hargaTiket * (jumlahTiket || 0);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEventId) {
      setErrorMsg('Pilih salah satu event');
      return;
    }
    if (!selectedPembeliId) {
      setErrorMsg('Pilih pembeli yang akan memesan');
      return;
    }
    if (!jumlahTiket || jumlahTiket < 1 || jumlahTiket > 5) {
      setErrorMsg('Jumlah tiket harus antara 1 sampai 5 lembar');
      return;
    }
    if (jumlahTiket > sisaKuota) {
      setErrorMsg(`Jumlah tiket melebihi sisa kuota (${sisaKuota} kursi tersedia)`);
      return;
    }

    const success = onSubmit({
      eventId: selectedEventId,
      pembeliId: selectedPembeliId,
      jumlahTiket,
    });

    if (success !== false) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Catat Pembelian Tiket</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Status awal akan otomatis menunggu bayar dan kuota event berkurang
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

        {/* Form Isi */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Field 1: Pilih Event */}
          <div className="space-y-1.5">
            <label htmlFor="select-event" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Pilih Event <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-event"
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
            >
              {events.length === 0 ? (
                <option value="">Belum ada event tersedia</option>
              ) : (
                events.map((ev) => {
                  const sisa = ev.kuota - ev.tiket_terjual;
                  return (
                    <option key={ev.id} value={ev.id} disabled={sisa <= 0}>
                      {ev.nama} — {formatRupiah(ev.harga_tiket)} ({sisa <= 0 ? 'Habis' : `Sisa ${sisa} kursi`})
                    </option>
                  );
                })
              )}
            </select>
            {currentEvent && (
              <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                <span>Tanggal: {currentEvent.tanggal}</span>
                <span className={sisaKuota <= 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                  {sisaKuota <= 0 ? 'Kuota Penuh' : `Tersedia: ${sisaKuota} kursi`}
                </span>
              </div>
            )}
          </div>

          {/* Field 2: Pilih Pembeli */}
          <div className="space-y-1.5">
            <label htmlFor="select-pembeli" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Pilih Pembeli <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-pembeli"
              value={selectedPembeliId}
              onChange={(e) => {
                setSelectedPembeliId(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
            >
              {pembeliList.length === 0 ? (
                <option value="">Belum ada data pembeli</option>
              ) : (
                pembeliList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.no_whatsapp})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Field 3: Jumlah Tiket (1-5) */}
          <div className="space-y-1.5">
            <label htmlFor="jumlah-tiket" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Jumlah Tiket (1 sampai 5) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="jumlah-tiket"
                type="number"
                min="1"
                max={Math.min(5, Math.max(1, sisaKuota))}
                value={jumlahTiket}
                onChange={(e) => {
                  setJumlahTiket(Math.floor(Number(e.target.value)));
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Maksimal 5 lembar per transaksi dan tidak melebihi sisa kuota event.
            </p>
          </div>

          {/* Kalkulasi Total Otomatis Sesuai AC 1 & Invariant 3 */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-indigo-900">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-600" />
                Harga per tiket:
              </span>
              <span className="font-semibold">{formatRupiah(hargaTiket)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-indigo-900">
              <span>Jumlah tiket dipesan:</span>
              <span className="font-semibold">{jumlahTiket || 0} lembar</span>
            </div>
            <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 uppercase">Total Bayar:</span>
              <span className="text-base font-extrabold text-indigo-700">
                {formatRupiah(totalHarga)}
              </span>
            </div>
          </div>

          {/* Footer Modal / Tombol Simpan Tiket */}
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
              disabled={sisaKuota <= 0}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-xs transition-colors ${
                sisaKuota <= 0
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
              }`}
            >
              Simpan Tiket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { ShieldAlert, Play, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, RefreshCw, Copy, Check, Database, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { collection, addDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { seedSemarangData, SeedResult } from '@/lib/seed-data';

interface TestResult {
  id: number;
  status: 'idle' | 'running' | 'rejected' | 'accepted';
  response?: string;
}

export default function UjiRulesPage() {
  const [results, setResults] = useState<Record<number, TestResult>>({
    1: { id: 1, status: 'idle' },
    2: { id: 2, status: 'idle' },
    3: { id: 3, status: 'idle' },
    4: { id: 4, status: 'idle' },
    5: { id: 5, status: 'idle' },
    6: { id: 6, status: 'idle' },
  });

  const [copiedRules, setCopiedRules] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);

  const handleSeedData = async () => {
    setSeedLoading(true);
    setSeedResult(null);
    try {
      const res = await seedSemarangData();
      setSeedResult(res);
    } catch (err: any) {
      setSeedResult({
        success: false,
        message: err.message || 'Gagal mengisi data sample',
        eventsCreated: 0,
        pembeliCreated: 0,
        tiketCreated: 0,
      });
    } finally {
      setSeedLoading(false);
    }
  };

  // Jalankan Uji 1: Field Kosong (Event tanpa nama)
  const runTest1 = async () => {
    setResults((prev) => ({ ...prev, 1: { id: 1, status: 'running' } }));
    try {
      await addDoc(collection(db, 'event'), {
        nama: '', // Kosong
        tanggal: '2026-10-20',
        lokasi: 'Ruang Karsa',
        harga_tiket: 50000,
        kuota: 50,
        tiket_terjual: 0,
      });
      setResults((prev) => ({
        ...prev,
        1: { id: 1, status: 'accepted', response: 'Data DITERIMA (Rules belum aktif di Firebase Console)' },
      }));
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        1: { id: 1, status: 'rejected', response: `${err.name || 'Error'}: ${err.message}` },
      }));
    }
  };

  // Jalankan Uji 2: Tipe Data Salah (Harga tiket string)
  const runTest2 = async () => {
    setResults((prev) => ({ ...prev, 2: { id: 2, status: 'running' } }));
    try {
      await addDoc(collection(db, 'event'), {
        nama: 'Konser Akustik',
        tanggal: '2026-10-20',
        lokasi: 'Ruang Karsa',
        harga_tiket: 'lima puluh ribu' as any, // String
        kuota: 50,
        tiket_terjual: 0,
      });
      setResults((prev) => ({
        ...prev,
        2: { id: 2, status: 'accepted', response: 'Data DITERIMA (Rules belum aktif)' },
      }));
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        2: { id: 2, status: 'rejected', response: `${err.name || 'Error'}: ${err.message}` },
      }));
    }
  };

  // Jalankan Uji 3: Teks Terlalu Panjang (> 60 karakter)
  const runTest3 = async () => {
    setResults((prev) => ({ ...prev, 3: { id: 3, status: 'running' } }));
    try {
      const longName = 'Nama Sangat Panjang Melebihi Batas Maksimum Enam Puluh Karakter yang Ditentukan Skema PRD Sesi 3';
      await setDoc(doc(db, 'pembeli', '081234567890'), {
        nama: longName,
        no_whatsapp: '081234567890',
        email: 'test@mail.com',
      });
      setResults((prev) => ({
        ...prev,
        3: { id: 3, status: 'accepted', response: 'Data DITERIMA (Rules belum aktif)' },
      }));
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        3: { id: 3, status: 'rejected', response: `${err.name || 'Error'}: ${err.message}` },
      }));
    }
  };

  // Jalankan Uji 4: Nilai Negatif (Harga tiket -25000)
  const runTest4 = async () => {
    setResults((prev) => ({ ...prev, 4: { id: 4, status: 'running' } }));
    try {
      await addDoc(collection(db, 'event'), {
        nama: 'Workshop Sablon',
        tanggal: '2026-10-20',
        lokasi: 'Ruang Karsa',
        harga_tiket: -25000, // Negatif
        kuota: 30,
        tiket_terjual: 0,
      });
      setResults((prev) => ({
        ...prev,
        4: { id: 4, status: 'accepted', response: 'Data DITERIMA (Rules belum aktif)' },
      }));
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        4: { id: 4, status: 'rejected', response: `${err.name || 'Error'}: ${err.message}` },
      }));
    }
  };

  // Jalankan Uji 5: Nilai di Luar Batas (Jumlah tiket 10, batas maks 5)
  const runTest5 = async () => {
    setResults((prev) => ({ ...prev, 5: { id: 5, status: 'running' } }));
    try {
      await addDoc(collection(db, 'tiket'), {
        event_id: 'dummy',
        nama_event: 'Dummy Event',
        tanggal_event: '2026-10-20',
        pembeli_id: '081355512345',
        nama_pembeli: 'Dummy',
        harga_tiket: 50000,
        jumlah_tiket: 10, // Di luar batas (maks 5)
        total: 500000,
        status: 'menunggu_bayar',
      });
      setResults((prev) => ({
        ...prev,
        5: { id: 5, status: 'accepted', response: 'Data DITERIMA (Rules belum aktif)' },
      }));
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        5: { id: 5, status: 'rejected', response: `${err.name || 'Error'}: ${err.message}` },
      }));
    }
  };

  // Jalankan Uji 6: Perubahan Status Tidak Sah (menunggu_bayar langsung ke hadir)
  const runTest6 = async () => {
    setResults((prev) => ({ ...prev, 6: { id: 6, status: 'running' } }));
    try {
      // Coba buat tiket menunggu_bayar lalu langsung update ke hadir
      const tiketRef = await addDoc(collection(db, 'tiket'), {
        event_id: 'dummy',
        nama_event: 'Dummy',
        tanggal_event: '2026-10-20',
        pembeli_id: '081355512345',
        nama_pembeli: 'Dummy',
        harga_tiket: 50000,
        jumlah_tiket: 1,
        total: 50000,
        status: 'menunggu_bayar',
      });

      // Update tidak sah: langsung lompat ke hadir
      await updateDoc(tiketRef, {
        status: 'hadir',
      });

      setResults((prev) => ({
        ...prev,
        6: { id: 6, status: 'accepted', response: 'Data DITERIMA (Rules belum aktif)' },
      }));
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        6: { id: 6, status: 'rejected', response: `${err.name || 'Error'}: ${err.message}` },
      }));
    }
  };

  const runAllTests = async () => {
    await runTest1();
    await runTest2();
    await runTest3();
    await runTest4();
    await runTest5();
    await runTest6();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Lembar Uji Mandiri: 6 Masukan Tidak Sah
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Security Rules Tester
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Uji tembus mandiri sesuai PRD Bagian 9 untuk memastikan Cloud Firestore menolak data tidak sah di level server.
          </p>
        </div>

        <button
          onClick={runAllTests}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Play className="w-4 h-4" />
          <span>Jalankan Semua Uji (1-6)</span>
        </button>
      </div>

      {/* Petunjuk Copy Rules ke Firebase Console */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-5 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Langkah Memasang Security Rules di Firebase Console:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed ml-1">
          <li>Buka tab <strong>Rules</strong> pada halaman Cloud Firestore di Firebase Console kamu.</li>
          <li>Salin seluruh isi berkas <code>firestore.rules</code> yang ada di repository proyek ini.</li>
          <li>Tempelkan (*paste*) ke editor Rules di Firebase Console, lalu klik tombol <strong>Publish</strong>.</li>
          <li>Setelah di-publish, klik tombol <em>Jalankan Semua Uji</em> di atas untuk memverifikasi penolakan (DITOLAK/Permission Denied).</li>
        </ol>
      </div>

      {/* Bagian Seeding Data Sample Semarang (8 Data Sesuai Rule Dashboard) */}
      <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Inisialisasi Data Sampel Kota Semarang (8 Transaksi Tiket)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Memasukkan data riil 3 Acara Kreatif Semarang (Kota Lama, TBRS, Sam Poo Kong), 8 Pembeli, dan tepat 2 tiket untuk setiap rule status dashboard (2 menunggu bayar, 2 lunas, 2 hadir, 2 dibatalkan).
            </p>
          </div>

          <button
            onClick={handleSeedData}
            disabled={seedLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
          >
            {seedLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses Data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Isi Data Sampel Semarang</span>
              </>
            )}
          </button>
        </div>

        {/* Notifikasi Hasil Seeding */}
        {seedResult && (
          <div
            className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              seedResult.success
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {seedResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{seedResult.message}</span>
            </div>

            {seedResult.success && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Link
                  href="/event"
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold"
                >
                  Lihat Event
                </Link>
                <Link
                  href="/tiket"
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold"
                >
                  Lihat Tiket
                </Link>
                <Link
                  href="/rekap"
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold"
                >
                  Lihat Rekap
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Daftar 6 Skenario Uji */}
      <div className="space-y-3.5">
        {[
          {
            id: 1,
            nama: '1. Uji Field Kosong',
            desc: 'Menyimpan dokumen event dengan nama kosong (""). Syarat PRD: nama minimal 1 karakter.',
            action: runTest1,
          },
          {
            id: 2,
            nama: '2. Uji Tipe Data Salah',
            desc: 'Menyimpan harga_tiket berupa string ("lima puluh ribu") bukan angka bulat. Syarat PRD: harga_tiket is number.',
            action: runTest2,
          },
          {
            id: 3,
            nama: '3. Uji Teks Terlalu Panjang',
            desc: 'Menyimpan pembeli dengan nama > 60 karakter. Syarat PRD: nama maksimal 60 karakter.',
            action: runTest3,
          },
          {
            id: 4,
            nama: '4. Uji Nilai Negatif',
            desc: 'Menyimpan harga_tiket = -25000. Syarat PRD (Invariant 1): harga_tiket tidak pernah negatif (>= 0).',
            action: runTest4,
          },
          {
            id: 5,
            nama: '5. Uji Nilai di Luar Batas',
            desc: 'Menyimpan tiket dengan jumlah_tiket = 10. Syarat PRD (Invariant 2): jumlah_tiket maksimal 5 lembar.',
            action: runTest5,
          },
          {
            id: 6,
            nama: '6. Uji Perubahan Status Tidak Sah',
            desc: 'Mengubah status tiket dari menunggu_bayar langsung meloncat ke hadir. Syarat PRD: menunggu_bayar hanya boleh ke lunas atau dibatalkan.',
            action: runTest6,
          },
        ].map((item) => {
          const res = results[item.id];

          return (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{item.nama}</h3>
                  {res.status === 'rejected' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ditolak Server (Lolos Uji)
                    </span>
                  )}
                  {res.status === 'accepted' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      Diterima (Rules Belum Aktif)
                    </span>
                  )}
                  {res.status === 'running' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Menguji ke Firestore...
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                {res.response && (
                  <p className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2 break-all">
                    Respon Server: {res.response}
                  </p>
                )}
              </div>

              <button
                onClick={item.action}
                disabled={res.status === 'running'}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer self-start md:self-auto shrink-0"
              >
                <Play className="w-3.5 h-3.5 text-indigo-600" />
                <span>Uji Skenario {item.id}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

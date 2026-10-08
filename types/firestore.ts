/**
 * Tipe Data Firestore untuk Karsa Tiket
 * 100% Mengikuti spesifikasi:
 * - PRD-Karsa-Tiket.docx.md
 * - Skema-Firestore-Karsa-Tiket.docx.md
 */

export interface EventItem {
  id: string; // ID Dokumen otomatis Firestore
  nama: string; // 1 - 60 karakter
  tanggal: string; // Format YYYY-MM-DD
  lokasi: string; // 1 - 100 karakter
  harga_tiket: number; // Angka bulat rupiah, minimal 0 (0 = gratis)
  kuota: number; // Angka bulat, 1 - 500
  tiket_terjual: number; // Angka bulat, minimal 0 dan <= kuota. Awal 0
  dibuat_pada?: any; // serverTimestamp()
}

export interface PembeliItem {
  id: string; // Sama dengan no_whatsapp (ID Dokumen)
  nama: string; // 1 - 60 karakter
  no_whatsapp: string; // Diawali 08, 10 - 13 angka
  email: string; // Mengandung @, maks 80 karakter
  dibuat_pada?: any; // serverTimestamp()
}

export type TiketStatus = 'menunggu_bayar' | 'lunas' | 'hadir' | 'dibatalkan';

export interface TiketItem {
  id: string; // ID Dokumen otomatis Firestore
  event_id: string; // ID dokumen event
  nama_event: string; // Salinan nama event saat tiket dibuat
  tanggal_event: string; // Salinan tanggal event (YYYY-MM-DD)
  pembeli_id: string; // ID dokumen pembeli (nomor WhatsApp)
  nama_pembeli: string; // Salinan nama pembeli saat tiket dibuat
  harga_tiket: number; // Salinan harga event saat tiket dibuat
  jumlah_tiket: number; // 1 - 5 dan tidak melebihi sisa kuota
  total: number; // harga_tiket * jumlah_tiket
  status: TiketStatus; // Status alur tiket
  dibuat_pada?: any; // serverTimestamp()
}

export interface RekapItem {
  eventId: string;
  namaEvent: string;
  tanggalEvent: string;
  lokasiEvent: string;
  hargaTiket: number;
  kuota: number;
  tiketTerjual: number;
  sisaKuota: number;
  pendapatan: number; // Dihitung HANYA dari status 'lunas' dan 'hadir'
  pesertaHadir: number; // Jumlah tiket berstatus 'hadir'
  totalTransaksi: number;
}

/**
 * Aturan transisi status tiket yang sah
 * Sesuai Bagian 4 & 5 PRD serta Bagian 5 Skema Firestore:
 * - menunggu_bayar -> lunas ATAU dibatalkan
 * - lunas -> hadir
 * - hadir -> (selesai, tidak boleh berubah)
 * - dibatalkan -> (selesai, tidak boleh berubah)
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<TiketStatus, TiketStatus[]> = {
  menunggu_bayar: ['lunas', 'dibatalkan'],
  lunas: ['hadir'],
  hadir: [],
  dibatalkan: [],
};

export const STATUS_LABELS: Record<TiketStatus, { label: string; bg: string; text: string; border: string }> = {
  menunggu_bayar: {
    label: 'Menunggu Bayar',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  lunas: {
    label: 'Lunas',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  hadir: {
    label: 'Hadir',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
  dibatalkan: {
    label: 'Dibatalkan',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { EventItem, PembeliItem, TiketItem, TiketStatus, ALLOWED_STATUS_TRANSITIONS } from '@/types/firestore';

/**
 * Service Layer Cloud Firestore untuk Karsa Tiket
 * 100% Mengikuti spesifikasi:
 * - PRD-Karsa-Tiket.docx.md
 * - Skema-Firestore-Karsa-Tiket.docx.md
 */

// ==========================================
// 1. KOLEKSI EVENT
// ==========================================
export const EventService = {
  // Read: getDocs(query(collection(db, "event"), orderBy("tanggal"), limit(20)))
  getAll: async (): Promise<EventItem[]> => {
    try {
      const q = query(collection(db, 'event'), orderBy('tanggal'), limit(20));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<EventItem, 'id'>),
      }));
    } catch (err) {
      // Fallback jika belum dibuat index tanggal
      const snapshot = await getDocs(query(collection(db, 'event'), limit(20)));
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<EventItem, 'id'>),
      }));
    }
  },

  // Create: addDoc(collection(db, "event"), {...}) dengan tiket_terjual: 0
  create: async (data: {
    nama: string;
    tanggal: string;
    lokasi: string;
    harga_tiket: number;
    kuota: number;
  }): Promise<string> => {
    const docRef = await addDoc(collection(db, 'event'), {
      nama: data.nama,
      tanggal: data.tanggal,
      lokasi: data.lokasi,
      harga_tiket: data.harga_tiket,
      kuota: data.kuota,
      tiket_terjual: 0, // Acceptance Criteria 1: bernilai 0
      dibuat_pada: serverTimestamp(),
    });
    return docRef.id;
  },

  // Update: updateDoc(doc(db, "event", id), {...})
  update: async (
    id: string,
    data: {
      nama: string;
      tanggal: string;
      lokasi: string;
      harga_tiket: number;
      kuota: number;
    }
  ): Promise<void> => {
    const eventRef = doc(db, 'event', id);
    await updateDoc(eventRef, {
      nama: data.nama,
      tanggal: data.tanggal,
      lokasi: data.lokasi,
      harga_tiket: data.harga_tiket,
      kuota: data.kuota,
    });
  },

  // Delete: deleteDoc(doc(db, "event", id))
  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'event', id));
  },
};

// ==========================================
// 2. KOLEKSI PEMBELI
// ==========================================
export const PembeliService = {
  // Read: getDocs(query(collection(db, "pembeli"), orderBy("nama"), limit(20)))
  getAll: async (): Promise<PembeliItem[]> => {
    try {
      const q = query(collection(db, 'pembeli'), orderBy('nama'), limit(20));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<PembeliItem, 'id'>),
      }));
    } catch {
      const snapshot = await getDocs(query(collection(db, 'pembeli'), limit(20)));
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<PembeliItem, 'id'>),
      }));
    }
  },

  // Create: getDoc lalu setDoc(doc(db, "pembeli", noWhatsapp), {...})
  create: async (data: {
    nama: string;
    no_whatsapp: string;
    email: string;
  }): Promise<void> => {
    const pembeliRef = doc(db, 'pembeli', data.no_whatsapp);
    // Acceptance criteria 2: Periksa apakah sudah ada
    const existingSnap = await getDoc(pembeliRef);
    if (existingSnap.exists()) {
      throw new Error('Nomor WhatsApp sudah terdaftar');
    }

    await setDoc(pembeliRef, {
      nama: data.nama,
      no_whatsapp: data.no_whatsapp,
      email: data.email,
      dibuat_pada: serverTimestamp(),
    });
  },

  // Update: updateDoc(doc(db, "pembeli", noWhatsapp), {...})
  update: async (
    noWhatsapp: string,
    data: {
      nama: string;
      email: string;
    }
  ): Promise<void> => {
    const pembeliRef = doc(db, 'pembeli', noWhatsapp);
    await updateDoc(pembeliRef, {
      nama: data.nama,
      email: data.email,
    });
  },

  // Delete: deleteDoc(doc(db, "pembeli", noWhatsapp))
  delete: async (noWhatsapp: string): Promise<void> => {
    await deleteDoc(doc(db, 'pembeli', noWhatsapp));
  },
};

// ==========================================
// 3. KOLEKSI TIKET
// ==========================================
export const TiketService = {
  // Read: getDocs(query(collection(db, "tiket"), orderBy("dibuat_pada", "desc"), limit(20)))
  getAll: async (): Promise<TiketItem[]> => {
    try {
      const q = query(collection(db, 'tiket'), orderBy('dibuat_pada', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<TiketItem, 'id'>),
      }));
    } catch {
      const snapshot = await getDocs(query(collection(db, 'tiket'), limit(20)));
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<TiketItem, 'id'>),
      }));
    }
  },

  /**
   * Create Tiket:
   * 1. addDoc(collection(db, "tiket"), {...})
   * 2. updateDoc(doc(db, "event", eventId), { tiket_terjual: increment(jumlah) })
   */
  create: async (params: {
    eventId: string;
    pembeliId: string;
    jumlahTiket: number;
  }): Promise<string> => {
    // 1. Ambil data event
    const eventRef = doc(db, 'event', params.eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) throw new Error('Event tidak ditemukan');
    const eventData = eventSnap.data() as EventItem;

    // 2. Ambil data pembeli
    const pembeliRef = doc(db, 'pembeli', params.pembeliId);
    const pembeliSnap = await getDoc(pembeliRef);
    if (!pembeliSnap.exists()) throw new Error('Pembeli tidak ditemukan');
    const pembeliData = pembeliSnap.data() as PembeliItem;

    // 3. Validasi batas kuota & jumlah tiket (Invariants 2)
    const sisaKuota = eventData.kuota - (eventData.tiket_terjual || 0);
    if (params.jumlahTiket < 1 || params.jumlahTiket > 5) {
      throw new Error('Jumlah tiket harus 1 sampai 5 lembar');
    }
    if (params.jumlahTiket > sisaKuota) {
      throw new Error(`Jumlah tiket melebihi sisa kuota (${sisaKuota} kursi tersedia)`);
    }

    const total = eventData.harga_tiket * params.jumlahTiket;

    // 4. Simpan dokumen tiket dengan snapshot
    const tiketDocRef = await addDoc(collection(db, 'tiket'), {
      event_id: params.eventId,
      nama_event: eventData.nama, // Snapshot
      tanggal_event: eventData.tanggal, // Snapshot
      pembeli_id: pembeliData.no_whatsapp,
      nama_pembeli: pembeliData.nama, // Snapshot
      harga_tiket: eventData.harga_tiket, // Snapshot
      jumlah_tiket: params.jumlahTiket,
      total: total,
      status: 'menunggu_bayar', // Status awal
      dibuat_pada: serverTimestamp(),
    });

    // 5. Atomic increment tiket_terjual pada event
    await updateDoc(eventRef, {
      tiket_terjual: increment(params.jumlahTiket),
    });

    return tiketDocRef.id;
  },

  /**
   * Update Status Tiket:
   * - Menjaga transisi status PRD
   * - Jika dibatalkan: kurangi kuota pada event dengan increment(-jumlah)
   */
  updateStatus: async (tiketId: string, newStatus: TiketStatus): Promise<void> => {
    const tiketRef = doc(db, 'tiket', tiketId);
    const tiketSnap = await getDoc(tiketRef);
    if (!tiketSnap.exists()) throw new Error('Tiket tidak ditemukan');
    const tiketData = tiketSnap.data() as TiketItem;

    const allowed = ALLOWED_STATUS_TRANSITIONS[tiketData.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Status ${tiketData.status} tidak diizinkan berubah langsung menjadi ${newStatus}`
      );
    }

    await updateDoc(tiketRef, { status: newStatus });

    // Acceptance criteria 4: Jika dibatalkan, kurangi tiket_terjual pada event
    if (newStatus === 'dibatalkan') {
      const eventRef = doc(db, 'event', tiketData.event_id);
      await updateDoc(eventRef, {
        tiket_terjual: increment(-tiketData.jumlah_tiket),
      });
    }
  },

  delete: async (tiketId: string): Promise<void> => {
    await deleteDoc(doc(db, 'tiket', tiketId));
  },
};

// ==========================================
// 4. MODUL REKAPITULASI (Dihitung dari event & tiket)
// ==========================================
export const RekapService = {
  getRekapForEvent: async (
    eventId: string
  ): Promise<{
    event: EventItem | null;
    tiketList: TiketItem[];
    tiketTerjual: number;
    sisaKuota: number;
    pendapatan: number;
    pesertaHadir: number;
  }> => {
    const eventRef = doc(db, 'event', eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
      return {
        event: null,
        tiketList: [],
        tiketTerjual: 0,
        sisaKuota: 0,
        pendapatan: 0,
        pesertaHadir: 0,
      };
    }

    const event = { id: eventSnap.id, ...(eventSnap.data() as Omit<EventItem, 'id'>) };

    // Query tiket where event_id == eventId
    const q = query(collection(db, 'tiket'), where('event_id', '==', eventId));
    const tiketSnap = await getDocs(q);
    const tiketList = tiketSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<TiketItem, 'id'>),
    }));

    const tiketTerjual = event.tiket_terjual || 0;
    const sisaKuota = Math.max(0, event.kuota - tiketTerjual);

    // Acceptance Criteria 2: Pendapatan HANYA dari tiket berstatus 'lunas' dan 'hadir'
    const pendapatan = tiketList
      .filter((t) => t.status === 'lunas' || t.status === 'hadir')
      .reduce((sum, t) => sum + (t.total || 0), 0);

    // Jumlah peserta hadir
    const pesertaHadir = tiketList
      .filter((t) => t.status === 'hadir')
      .reduce((sum, t) => sum + (t.jumlah_tiket || 0), 0);

    return {
      event,
      tiketList,
      tiketTerjual,
      sisaKuota,
      pendapatan,
      pesertaHadir,
    };
  },
};

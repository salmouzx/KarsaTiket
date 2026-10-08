import { EventItem, PembeliItem, TiketItem, TiketStatus, ALLOWED_STATUS_TRANSITIONS } from '@/types/firestore';

const STORAGE_KEYS = {
  EVENTS: 'karsa_tiket_events_v1',
  PEMBELI: 'karsa_tiket_pembeli_v1',
  TIKET: 'karsa_tiket_items_v1',
};

// Data Awal Berdasarkan Skema Firestore
const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'Ev27dKm',
    nama: 'Workshop Sablon Tote Bag',
    tanggal: '2026-10-18',
    lokasi: 'Ruang Karsa, Jl. Merdeka No. 21',
    harga_tiket: 75000,
    kuota: 30,
    tiket_terjual: 3, // 2 dari Tk63fHs + 1 dari Tk92gLm
  },
  {
    id: 'Ev91aBc',
    nama: 'Konser Akustik Indie Senja',
    tanggal: '2026-10-25',
    lokasi: 'Amfiteater Komunitas Karsa',
    harga_tiket: 50000,
    kuota: 100,
    tiket_terjual: 100, // Kuota penuh / Habis
  },
];

const INITIAL_PEMBELI: PembeliItem[] = [
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

const INITIAL_TIKET: TiketItem[] = [
  {
    id: 'Tk63fHs',
    event_id: 'Ev27dKm',
    nama_event: 'Workshop Sablon Tote Bag',
    tanggal_event: '2026-10-18',
    pembeli_id: '081355512345',
    nama_pembeli: 'Nadia Putri',
    harga_tiket: 75000,
    jumlah_tiket: 2,
    total: 150000,
    status: 'menunggu_bayar',
  },
  {
    id: 'Tk92gLm',
    event_id: 'Ev27dKm',
    nama_event: 'Workshop Sablon Tote Bag',
    tanggal_event: '2026-10-18',
    pembeli_id: '081298765432',
    nama_pembeli: 'Budi Pratama',
    harga_tiket: 75000,
    jumlah_tiket: 1,
    total: 75000,
    status: 'lunas',
  },
];

// In-memory cache fallback
let memoryEvents = [...INITIAL_EVENTS];
let memoryPembeli = [...INITIAL_PEMBELI];
let memoryTiket = [...INITIAL_TIKET];

const isBrowser = typeof window !== 'undefined';

export const Store = {
  // --- EVENT ---
  getEvents: (): EventItem[] => {
    if (!isBrowser) return memoryEvents;
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_EVENTS;
    }
  },

  saveEvent: (eventData: Omit<EventItem, 'id'> & { id?: string }): EventItem => {
    const list = Store.getEvents();
    if (eventData.id) {
      // Edit
      const updated = list.map((item) =>
        item.id === eventData.id ? { ...(item as EventItem), ...eventData } : item
      );
      if (isBrowser) localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));
      memoryEvents = updated;
      return updated.find((i) => i.id === eventData.id)!;
    } else {
      // Create baru: ID otomatis, tiket_terjual 0
      const newEvent: EventItem = {
        id: 'Ev' + Math.random().toString(36).substring(2, 7),
        nama: eventData.nama,
        tanggal: eventData.tanggal,
        lokasi: eventData.lokasi,
        harga_tiket: eventData.harga_tiket,
        kuota: eventData.kuota,
        tiket_terjual: 0,
      };
      const updated = [newEvent, ...list];
      if (isBrowser) localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));
      memoryEvents = updated;
      return newEvent;
    }
  },

  deleteEvent: (id: string): void => {
    const list = Store.getEvents().filter((e) => e.id !== id);
    if (isBrowser) localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(list));
    memoryEvents = list;
  },

  // --- PEMBELI ---
  getPembeli: (): PembeliItem[] => {
    if (!isBrowser) return memoryPembeli;
    const raw = localStorage.getItem(STORAGE_KEYS.PEMBELI);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PEMBELI, JSON.stringify(INITIAL_PEMBELI));
      return INITIAL_PEMBELI;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PEMBELI;
    }
  },

  savePembeli: (data: Omit<PembeliItem, 'dibuat_pada'>): { success: boolean; error?: string } => {
    const list = Store.getPembeli();
    const existingIndex = list.findIndex((p) => p.id === data.id);

    if (existingIndex >= 0) {
      // Edit nama/email
      list[existingIndex] = { ...list[existingIndex], nama: data.nama, email: data.email };
    } else {
      // Tambah baru: Pastikan no_whatsapp belum ada
      if (list.some((p) => p.no_whatsapp === data.no_whatsapp)) {
        return { success: false, error: 'Nomor WhatsApp sudah terdaftar' };
      }
      const newPembeli: PembeliItem = {
        id: data.no_whatsapp,
        no_whatsapp: data.no_whatsapp,
        nama: data.nama,
        email: data.email,
      };
      list.unshift(newPembeli);
    }

    if (isBrowser) localStorage.setItem(STORAGE_KEYS.PEMBELI, JSON.stringify(list));
    memoryPembeli = list;
    return { success: true };
  },

  deletePembeli: (id: string): void => {
    const list = Store.getPembeli().filter((p) => p.id !== id);
    if (isBrowser) localStorage.setItem(STORAGE_KEYS.PEMBELI, JSON.stringify(list));
    memoryPembeli = list;
  },

  // --- TIKET ---
  getTiket: (): TiketItem[] => {
    if (!isBrowser) return memoryTiket;
    const raw = localStorage.getItem(STORAGE_KEYS.TIKET);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TIKET, JSON.stringify(INITIAL_TIKET));
      return INITIAL_TIKET;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TIKET;
    }
  },

  /**
   * Catat Tiket Baru:
   * - Menghitung total = harga_tiket * jumlah_tiket
   * - Menyimpan snapshot harga, nama event, nama pembeli
   * - Status awal: 'menunggu_bayar'
   * - Menambah tiket_terjual pada event
   */
  createTiket: (params: {
    eventId: string;
    pembeliId: string;
    jumlahTiket: number;
  }): { success: boolean; tiket?: TiketItem; error?: string } => {
    const events = Store.getEvents();
    const pembeliList = Store.getPembeli();

    const targetEvent = events.find((e) => e.id === params.eventId);
    if (!targetEvent) return { success: false, error: 'Event tidak ditemukan' };

    const targetPembeli = pembeliList.find((p) => p.id === params.pembeliId);
    if (!targetPembeli) return { success: false, error: 'Pembeli tidak ditemukan' };

    const sisaKuota = targetEvent.kuota - targetEvent.tiket_terjual;

    // Invariants & AC 2:
    if (params.jumlahTiket < 1 || params.jumlahTiket > 5) {
      return { success: false, error: 'Jumlah tiket harus 1 sampai 5 lembar' };
    }
    if (params.jumlahTiket > sisaKuota) {
      return { success: false, error: `Jumlah tiket melebihi sisa kuota (${sisaKuota} kursi tersedia)` };
    }

    const newId = 'Tk' + Math.random().toString(36).substring(2, 7);
    const newTiket: TiketItem = {
      id: newId,
      event_id: targetEvent.id,
      nama_event: targetEvent.nama, // Snapshot
      tanggal_event: targetEvent.tanggal, // Snapshot
      pembeli_id: targetPembeli.id,
      nama_pembeli: targetPembeli.nama, // Snapshot
      harga_tiket: targetEvent.harga_tiket, // Snapshot
      jumlah_tiket: params.jumlahTiket,
      total: targetEvent.harga_tiket * params.jumlahTiket, // Rumus total
      status: 'menunggu_bayar', // Status awal
    };

    // Tambah tiket ke daftar
    const allTiket = [newTiket, ...Store.getTiket()];
    if (isBrowser) localStorage.setItem(STORAGE_KEYS.TIKET, JSON.stringify(allTiket));
    memoryTiket = allTiket;

    // AC 1: Tambah tiket_terjual pada event
    targetEvent.tiket_terjual += params.jumlahTiket;
    if (isBrowser) localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    memoryEvents = events;

    return { success: true, tiket: newTiket };
  },

  /**
   * Perbarui Status Tiket:
   * - Menjaga aturan transisi status:
   *   menunggu_bayar -> lunas atau dibatalkan
   *   lunas -> hadir
   * - Jika dibatalkan: kurangi tiket_terjual pada event
   */
  updateTiketStatus: (
    tiketId: string,
    newStatus: TiketStatus
  ): { success: boolean; error?: string } => {
    const allTiket = Store.getTiket();
    const index = allTiket.findIndex((t) => t.id === tiketId);
    if (index === -1) return { success: false, error: 'Tiket tidak ditemukan' };

    const currentTiket = allTiket[index];
    const allowed = ALLOWED_STATUS_TRANSITIONS[currentTiket.status];

    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Status ${currentTiket.status} tidak boleh diubah langsung menjadi ${newStatus}`,
      };
    }

    currentTiket.status = newStatus;

    // AC 4: Jika tiket dibatalkan, kurangi tiket_terjual pada event
    if (newStatus === 'dibatalkan') {
      const events = Store.getEvents();
      const targetEvent = events.find((e) => e.id === currentTiket.event_id);
      if (targetEvent) {
        targetEvent.tiket_terjual = Math.max(0, targetEvent.tiket_terjual - currentTiket.jumlah_tiket);
        if (isBrowser) localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
        memoryEvents = events;
      }
    }

    if (isBrowser) localStorage.setItem(STORAGE_KEYS.TIKET, JSON.stringify(allTiket));
    memoryTiket = allTiket;
    return { success: true };
  },

  deleteTiket: (id: string): void => {
    const list = Store.getTiket().filter((t) => t.id !== id);
    if (isBrowser) localStorage.setItem(STORAGE_KEYS.TIKET, JSON.stringify(list));
    memoryTiket = list;
  },
};

import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface SeedResult {
  success: boolean;
  message: string;
  eventsCreated: number;
  pembeliCreated: number;
  tiketCreated: number;
}

export async function seedSemarangData(): Promise<SeedResult> {
  try {
    // 0. BERSIHKAN DATA EVENT & TIKET LAMA AGAR TIDAK DUPLIKAT
    const existingEvents = await getDocs(collection(db, 'event'));
    for (const d of existingEvents.docs) {
      await deleteDoc(doc(db, 'event', d.id));
    }

    const existingTiket = await getDocs(collection(db, 'tiket'));
    for (const d of existingTiket.docs) {
      await deleteDoc(doc(db, 'tiket', d.id));
    }

    // 1. TAMBAH 3 EVENT DI SEMARANG (tiket_terjual diawali 0 sesuai Security Rules)
    const event1Ref = await addDoc(collection(db, 'event'), {
      nama: 'Semarang Creative Expo 2026',
      tanggal: '2026-10-25',
      lokasi: 'Gedung Marabunta, Kota Lama, Semarang',
      harga_tiket: 50000,
      kuota: 100,
      tiket_terjual: 0,
      dibuat_pada: serverTimestamp(),
    });

    const event2Ref = await addDoc(collection(db, 'event'), {
      nama: 'Workshop Cukil Kayu & Seni Cetak',
      tanggal: '2026-11-08',
      lokasi: 'Taman Budaya Raden Saleh (TBRS), Semarang',
      harga_tiket: 35000,
      kuota: 40,
      tiket_terjual: 0,
      dibuat_pada: serverTimestamp(),
    });

    const event3Ref = await addDoc(collection(db, 'event'), {
      nama: 'Festival Akustik Senja Sam Poo Kong',
      tanggal: '2026-11-20',
      lokasi: 'Plataran Klenteng Sam Poo Kong, Semarang',
      harga_tiket: 75000,
      kuota: 150,
      tiket_terjual: 0,
      dibuat_pada: serverTimestamp(),
    });

    // 2. TAMBAH 8 PEMBELI (ID dokumen = no_whatsapp diawali 08, 10-13 digit)
    const pembeliData = [
      { nama: 'Dimas Prasetyo', no_whatsapp: '081234567801', email: 'dimas.prasetyo@gmail.com' },
      { nama: 'Anisa Wulandari', no_whatsapp: '081234567802', email: 'anisa.wulan@gmail.com' },
      { nama: 'Bagas Kurniawan', no_whatsapp: '081234567803', email: 'bagas.kurnia@gmail.com' },
      { nama: 'Citra Dewi Lestari', no_whatsapp: '081234567804', email: 'citra.dewi@gmail.com' },
      { nama: 'Eko Nugroho Santoso', no_whatsapp: '081234567805', email: 'eko.nugroho@gmail.com' },
      { nama: 'Fani Rahmawati', no_whatsapp: '081234567806', email: 'fani.rahma@gmail.com' },
      { nama: 'Gilang Ramadhan', no_whatsapp: '081234567807', email: 'gilang.ramadhan@gmail.com' },
      { nama: 'Hesti Prameswari', no_whatsapp: '081234567808', email: 'hesti.prameswari@gmail.com' },
    ];

    for (const p of pembeliData) {
      await setDoc(doc(db, 'pembeli', p.no_whatsapp), {
        nama: p.nama,
        no_whatsapp: p.no_whatsapp,
        email: p.email,
        dibuat_pada: serverTimestamp(),
      });
    }

    // 3. TAMBAH 8 TIKET DENGAN STATUS AWAL 'menunggu_bayar'
    // Tiket 1 (Event 1, Dimas, 2 lembar) -> tetap menunggu_bayar
    await addDoc(collection(db, 'tiket'), {
      event_id: event1Ref.id,
      nama_event: 'Semarang Creative Expo 2026',
      tanggal_event: '2026-10-25',
      pembeli_id: '081234567801',
      nama_pembeli: 'Dimas Prasetyo',
      harga_tiket: 50000,
      jumlah_tiket: 2,
      total: 100000,
      status: 'menunggu_bayar',
      dibuat_pada: serverTimestamp(),
    });

    // Tiket 2 (Event 2, Anisa, 1 lembar) -> tetap menunggu_bayar
    await addDoc(collection(db, 'tiket'), {
      event_id: event2Ref.id,
      nama_event: 'Workshop Cukil Kayu & Seni Cetak',
      tanggal_event: '2026-11-08',
      pembeli_id: '081234567802',
      nama_pembeli: 'Anisa Wulandari',
      harga_tiket: 35000,
      jumlah_tiket: 1,
      total: 35000,
      status: 'menunggu_bayar',
      dibuat_pada: serverTimestamp(),
    });

    // Tiket 3 (Event 1, Bagas, 3 lembar) -> update ke 'lunas'
    const t3Ref = await addDoc(collection(db, 'tiket'), {
      event_id: event1Ref.id,
      nama_event: 'Semarang Creative Expo 2026',
      tanggal_event: '2026-10-25',
      pembeli_id: '081234567803',
      nama_pembeli: 'Bagas Kurniawan',
      harga_tiket: 50000,
      jumlah_tiket: 3,
      total: 150000,
      status: 'menunggu_bayar',
      dibuat_pada: serverTimestamp(),
    });
    await updateDoc(t3Ref, { status: 'lunas' });

    // Tiket 4 (Event 2, Citra, 2 lembar) -> update ke 'lunas'
    const t4Ref = await addDoc(collection(db, 'tiket'), {
      event_id: event2Ref.id,
      nama_event: 'Workshop Cukil Kayu & Seni Cetak',
      tanggal_event: '2026-11-08',
      pembeli_id: '081234567804',
      nama_pembeli: 'Citra Dewi Lestari',
      harga_tiket: 35000,
      jumlah_tiket: 2,
      total: 70000,
      status: 'menunggu_bayar',
      dibuat_pada: serverTimestamp(),
    });
    await updateDoc(t4Ref, { status: 'lunas' });

    // Tiket 5 (Event 1, Eko, 2 lembar) -> update ke 'lunas' lalu ke 'hadir'
    const t5Ref = await addDoc(collection(db, 'tiket'), {
      event_id: event1Ref.id,
      nama_event: 'Semarang Creative Expo 2026',
      tanggal_event: '2026-10-25',
      pembeli_id: '081234567805',
      nama_pembeli: 'Eko Nugroho Santoso',
      harga_tiket: 50000,
      jumlah_tiket: 2,
      total: 100000,
      status: 'menunggu_bayar',
      dibuat_pada: serverTimestamp(),
    });
    await updateDoc(t5Ref, { status: 'lunas' });
    await updateDoc(t5Ref, { status: 'hadir' });

    // Tiket 6 (Event 3, Fani, 2 lembar) -> update ke 'lunas' lalu ke 'hadir'
    const t6Ref = await addDoc(collection(db, 'tiket'), {
      event_id: event3Ref.id,
      nama_event: 'Festival Akustik Senja Sam Poo Kong',
      tanggal_event: '2026-11-20',
      pembeli_id: '081234567806',
      nama_pembeli: 'Fani Rahmawati',
      harga_tiket: 75000,
      jumlah_tiket: 2,
      total: 150000,
      status: 'menunggu_bayar',
      dibuat_pada: serverTimestamp(),
    });
    await updateDoc(t6Ref, { status: 'lunas' });
    await updateDoc(t6Ref, { status: 'hadir' });

    // Tiket 7 (Event 1, Gilang, 1 lembar) -> update ke 'dibatalkan'
    const t7Ref = await addDoc(collection(db, 'tiket'), {
      event_id: event1Ref.id,
      nama_event: 'Semarang Creative Expo 2026',
      tanggal_event: '2026-10-25',
      pembeli_id: '081234567807',
      nama_pembeli: 'Gilang Ramadhan',
      harga_tiket: 50000,
      jumlah_tiket: 1,
      total: 50000,
      status: 'menunggu_bayar',
      dibuat_pada: serverTimestamp(),
    });
    await updateDoc(t7Ref, { status: 'dibatalkan' });

    // Tiket 8 (Event 3, Hesti, 1 lembar) -> update ke 'dibatalkan'
    const t8Ref = await addDoc(collection(db, 'tiket'), {
      event_id: event3Ref.id,
      nama_event: 'Festival Akustik Senja Sam Poo Kong',
      tanggal_event: '2026-11-20',
      pembeli_id: '081234567808',
      nama_pembeli: 'Hesti Prameswari',
      harga_tiket: 75000,
      jumlah_tiket: 1,
      total: 75000,
      status: 'menunggu_bayar',
      dibuat_pada: serverTimestamp(),
    });
    await updateDoc(t8Ref, { status: 'dibatalkan' });

    // 4. PERBARUI TIKET_TERJUAL PADA MASING-MASING EVENT
    // Event 1: Dimas(2) + Bagas(3) + Eko(2) = 7
    await updateDoc(event1Ref, {
      nama: 'Semarang Creative Expo 2026',
      tanggal: '2026-10-25',
      lokasi: 'Gedung Marabunta, Kota Lama, Semarang',
      harga_tiket: 50000,
      kuota: 100,
      tiket_terjual: 7,
    });

    // Event 2: Anisa(1) + Citra(2) = 3
    await updateDoc(event2Ref, {
      nama: 'Workshop Cukil Kayu & Seni Cetak',
      tanggal: '2026-11-08',
      lokasi: 'Taman Budaya Raden Saleh (TBRS), Semarang',
      harga_tiket: 35000,
      kuota: 40,
      tiket_terjual: 3,
    });

    // Event 3: Fani(2) = 2
    await updateDoc(event3Ref, {
      nama: 'Festival Akustik Senja Sam Poo Kong',
      tanggal: '2026-11-20',
      lokasi: 'Plataran Klenteng Sam Poo Kong, Semarang',
      harga_tiket: 75000,
      kuota: 150,
      tiket_terjual: 2,
    });

    return {
      success: true,
      message: 'Berhasil mengisi data sample Semarang (3 Event, 8 Pembeli, 8 Tiket) ke Cloud Firestore!',
      eventsCreated: 3,
      pembeliCreated: 8,
      tiketCreated: 8,
    };
  } catch (error: any) {
    console.error('Error saat seeding data sample:', error);
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengisi data sample',
      eventsCreated: 0,
      pembeliCreated: 0,
      tiketCreated: 0,
    };
  }
}

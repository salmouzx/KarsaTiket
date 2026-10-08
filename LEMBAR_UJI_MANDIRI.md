# Lembar Uji Mandiri: Uji Tembus 6 Masukan Tidak Sah (Security Rules)

**Aplikasi**: Karsa Tiket (Tiketing Event)  
**Database**: Cloud Firestore (`karsatiket-salma`)  
**Dokumen Acuan**: [PRD-Karsa-Tiket.docx.md](file:///e:/aabootcamp_ioda/Minggu%20ke-3%20%28Mandiri%29/KarsaTiket/PRD-Karsa-Tiket.docx.md) Bagian 9 & [Skema-Firestore-Karsa-Tiket.docx.md](file:///e:/aabootcamp_ioda/Minggu%20ke-3%20%28Mandiri%29/KarsaTiket/Skema-Firestore-Karsa-Tiket.docx.md) Bagian 7.

---

## 📋 Tabel Hasil Uji Tembus Mandiri

| No | Jenis Masukan Tidak Sah | Koleksi Target | Data yang Dikirim (Payload) | Jalur Pengiriman | Hasil Pengujian | Kondisi Data Akhir di Firestore |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Field Kosong** | `event` | `{ nama: "", tanggal: "2026-10-20", lokasi: "Ruang Karsa", harga_tiket: 50000, kuota: 50, tiket_terjual: 0 }` | Firestore Client SDK / Konsol Browser | ❌ **DITOLAK** (`FirebaseError: Missing or insufficient permissions`) | Dokumen **TIDAK tersimpan** ke Firestore. Koleksi tetap bersih. |
| **2** | **Tipe Data Salah** | `event` | `{ nama: "Konser Mini", tanggal: "2026-10-20", lokasi: "Ruang Karsa", harga_tiket: "lima puluh ribu", kuota: 50, tiket_terjual: 0 }` | Firestore Client SDK / Konsol Browser | ❌ **DITOLAK** (`FirebaseError: Missing or insufficient permissions`) | Dokumen **TIDAK tersimpan**. Aturan `is number` menolak tipe string. |
| **3** | **Teks Terlalu Panjang** | `pembeli` | `{ nama: "Nama Sangat Panjang Melebihi Batas Maksimum Enam Puluh Karakter yang Ditentukan Skema", no_whatsapp: "081234567890", email: "test@mail.com" }` | Firestore Client SDK / Konsol Browser | ❌ **DITOLAK** (`FirebaseError: Missing or insufficient permissions`) | Dokumen **TIDAK tersimpan**. Batas `size() <= 60` aktif. |
| **4** | **Nilai Negatif** | `event` | `{ nama: "Workshop Sablon", tanggal: "2026-10-20", lokasi: "Ruang Karsa", harga_tiket: -25000, kuota: 30, tiket_terjual: 0 }` | Firestore Client SDK / Konsol Browser | ❌ **DITOLAK** (`FirebaseError: Missing or insufficient permissions`) | Dokumen **TIDAK tersimpan**. Aturan `harga_tiket >= 0` (Invariant 1) menolak nilai minus. |
| **5** | **Nilai di Luar Batas** | `tiket` | `{ event_id: "Ev27dKm", pembeli_id: "081355512345", jumlah_tiket: 10, total: 750000, status: "menunggu_bayar" }` *(Batas maks: 5 lembar)* | Firestore Client SDK / Konsol Browser | ❌ **DITOLAK** (`FirebaseError: Missing or insufficient permissions`) | Dokumen **TIDAK tersimpan**. Aturan `jumlah_tiket <= 5` (Invariant 2) aktif. |
| **6** | **Perubahan Status Tidak Sah** | `tiket` | Mengubah status tiket dari `menunggu_bayar` langsung melompat ke `hadir` tanpa melalui status `lunas` | Firestore Client SDK / Konsol Browser | ❌ **DITOLAK** (`FirebaseError: Missing or insufficient permissions`) | Status di Firestore **TETAP** `menunggu_bayar`, perubahan status loncat digagalkan. |

---

## 🛡️ Kesimpulan Pengujian Security Rules
Seluruh 6 skenario masukan tidak sah berhasil diblokir oleh aturan [firestore.rules](file:///e:/aabootcamp_ioda/Minggu%20ke-3%20%28Mandiri%29/KarsaTiket/firestore.rules) langsung di sisi server database Cloud Firestore, menjaga ketiga Invariant data tetap konsisten dan valid.

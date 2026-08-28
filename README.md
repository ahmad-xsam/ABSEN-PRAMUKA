# Aplikasi Rekap Latihan Pramuka Sordu

Aplikasi Rekap Laporan Latihan Ekstrakurikuler Pramuka Sordu berbasis Web dengan fitur input kegiatan, manajemen 2 foto dokumentasi per pertemuan, filter bulanan/tahun pelajaran, serta fitur **Unduh PDF & Cetak Dokumen** A4 presisi sesuai standar format laporan.

---

## 🌟 Fitur Utama Aplikasi

1. **Input Data Latihan**:
   - Pemilihan Tanggal dengan konversi otomatis nama hari & tanggal Bahasa Indonesia (Contoh: `Sabtu, 01 Agustus 2026`).
   - Uraian Kegiatan Latihan.
   - Upload **2 Foto Dokumentasi** per kegiatan latihan dengan penyesuaian otomatis.
   - Pilihan Tahun Pelajaran (misal: `2026-2027`).

2. **Rekap Bulanan & Filter**:
   - Filter rekap bulanan (Januari - Desember) dan Tahun Pelajaran.
   - Pencarian cepat uraian kegiatan.
   - Penyimpanan data aman dan tanpa kuota terbatas berbasis **IndexedDB**.

3. **Cetak & Unduh PDF Presisi (100% Sesuai Template)**:
   - Header Laporan:
     ```text
     LAPORAN KEGIATAN EKSTRAKURIKULER
     PRAMUKA BULAN [NAMA BULAN]
     TAHUN PELAJARAN [TAHUN PELAJARAN]
     ```
   - Tabel bergaris tebal rapi memuat kolom `No.`, `Hari, Tanggal`, `Uraian Kegiatan`, dan `Dokumentasi` (2 foto disandingkan *side-by-side*).
   - Opsi **Unduh PDF** instan via `html2pdf.js` & Opsi **Cetak** via browser.

4. **Backup & Restore Data**:
   - Fitur ekspor/impor seluruh data dalam format `.json` untuk dipindahkan antar perangkat.

---

## 🚀 Panduan Upload ke GitHub & Vercel Deployment

### 1. Push ke GitHub (`https://github.com/ahmad-xsam/ABSEN-PRAMUKA.git`)

Buka terminal pada folder proyek ini (`pramuka-sordu`) lalu jalankan perintah berikut:

```bash
# Initialize Repository
git init

# Tambahkan Semua Berkas
git add .

# Commit Perubahan
git commit -m "feat: Inisialisasi Aplikasi Rekap Latihan Pramuka Sordu"

# Atur Branch Utama
git branch -M main

# Tambahkan Remote GitHub
git remote add origin https://github.com/ahmad-xsam/ABSEN-PRAMUKA.git

# Push ke Repository GitHub
git push -u origin main
```

---

### 2. Deployment ke Vercel App (`https://absensipramuka.vercel.app/`)

1. Buka dashboard [Vercel](https://vercel.com/) dan login menggunakan akun GitHub Anda.
2. Klik tombol **"Add New"** -> **"Project"**.
3. Pilih repository **`ahmad-xsam/ABSEN-PRAMUKA`** lalu klik **Import**.
4. Pada bagian *Framework Preset*, biarkan **Other** (Static Web).
5. Pada *Domain Settings*, hubungkan domain custom Vercel Anda ke `absensipramuka.vercel.app`.
6. Klik **Deploy**. Aplikasi akan langsung aktif dan dapat diakses dari perangkat HP maupun Desktop!

---

*Dikembangkan untuk Pramuka Sordu.*

# Simpatik — Sistem Informasi Pelayanan Statistik
### Versi Next.js + Supabase — BPS Kota Jambi

Aplikasi ini adalah **versi paralel** dari Simpatik (sebelumnya dibangun dengan
Laravel + MySQL) menggunakan stack modern: **Next.js 15 (App Router)** +
**Supabase** (Postgres + Auth + Storage + Realtime), di-deploy ke **Vercel**.

---

## 🏗️ Arsitektur & Perbedaan dari Versi Laravel

| Aspek | Versi Laravel | Versi Next.js (ini) |
|-------|---------------|----------------------|
| Backend | Controller + Eloquent | Server Actions + Supabase Client |
| Autentikasi | Laravel Breeze + Spatie Permission | Supabase Auth + tabel `profiles` + RLS |
| Proteksi Role | Middleware `role:admin` | `middleware.ts` + Row Level Security (RLS) |
| Database | MySQL | Postgres (Supabase) |
| Real-time display antrian | `<meta refresh>` tiap 10 detik | **Supabase Realtime** (`postgres_changes`), update instan |
| Upload jadwal massal | Excel (PhpSpreadsheet) | **CSV** (parsing native, bisa dibuat/diedit dari Excel) |
| File upload pengaduan | Laravel Storage (lokal) | Supabase Storage (bucket `pengaduan`) |
| Hosting | VPS (Nginx + PHP-FPM) | Vercel (serverless) |

**Keamanan data** tidak lagi bertumpu pada logika di Controller saja —
mayoritas aturan akses (siapa boleh baca/tulis apa) didefinisikan langsung
di database lewat **Row Level Security (RLS)**, lihat
`supabase/migrations/0001_init.sql`. Ini lapisan pertahanan yang lebih kuat
karena berlaku bahkan jika ada bug di kode aplikasi.

---

## 📁 Struktur Proyek

```
simpatik-next/
├── app/
│   ├── page.tsx                ← Landing page Simpatik (halaman utama "/", di luar route group publik)
│   ├── (publik)/                ← Route group, berbagi layout publik (tanpa login)
│   │   ├── antrian/page.tsx      → Ambil antrian — SENGAJA tidak ada di menu navigasi
│   │   │                           (cuma untuk kios/tablet di ruang pelayanan, cegah
│   │   │                           pengunjung ambil nomor dari luar kantor)
│   │   ├── antrian/[kode]/tiket/page.tsx
│   │   ├── jadwal-petugas/page.tsx
│   │   ├── permintaan-data/page.tsx (+ lacak/[token]/page.tsx)
│   │   ├── penilaian/[kode]/page.tsx
│   │   └── pengaduan/page.tsx
│   ├── display-antrian/        ← Fullscreen, layout sendiri, Supabase Realtime
│   ├── login/page.tsx
│   ├── admin/                  ← Wajib login + role admin (dijamin middleware.ts)
│   │   ├── dashboard/, petugas/, shift/, jenis-layanan/,
│   │   │   jadwal/, pengaduan/, penilaian/, laporan/
│   └── petugas/                ← Wajib login + role petugas
│       ├── dashboard/, jadwal/, presensi/
├── lib/
│   ├── supabase/{server,client,admin}.ts   ← Supabase client per konteks
│   ├── actions/                             ← Server Actions (pengganti Controller)
│   ├── types/database.ts                    ← Tipe TypeScript skema DB
│   └── utils.ts                             ← Format tanggal/jam WIB, badge status
├── components/{ui,layouts}/
├── middleware.ts                ← Proteksi route + refresh sesi
├── supabase/migrations/         ← Skema DB + RLS + seed
└── scripts/seed-users.ts        ← Buat akun admin/petugas awal
```

---

## 🚀 Setup Lokal (Development)

### 1. Buat Project Supabase
1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Catat **Project URL** dan **anon public key** (Settings → API)
3. Catat juga **service_role key** (⚠️ rahasia, jangan expose ke client)

### 2. Jalankan Migration
Buka **SQL Editor** di Supabase Dashboard, jalankan berurutan:
1. Isi file `supabase/migrations/0001_init.sql` — skema + RLS + function
2. Isi file `supabase/migrations/0002_seed.sql` — data awal (shift, jenis layanan)

> **Instalasi baru**: cukup langkah 1 & 2 di atas, sudah termasuk 3 jenis
> layanan final (Pelayanan Statistik, Permintaan Informasi Publik, Umum).
>
> **Instalasi lama** yang sudah pernah menjalankan `0002_seed.sql` versi
> sebelumnya (5 kategori A–E): jalankan tambahan
> `supabase/migrations/0003_jenis_layanan_baru.sql` untuk merapikan jadi
> 3 kategori tanpa merusak data antrian/laporan historis yang sudah ada.

> Atau via Supabase CLI: `supabase db push` (lihat dokumentasi Supabase CLI).

### 3. Install Dependency
```bash
npm install
```

### 4. Konfigurasi Environment
```bash
cp .env.example .env.local
```
Isi `.env.local` dengan URL & key dari langkah 1.

### 5. Buat Akun Admin & Petugas Awal
```bash
npm run seed:users
```
Script ini membuat 1 akun admin + 6 akun petugas lewat Supabase Auth Admin API,
dan otomatis mengisi tabel `profiles` (via trigger `on_auth_user_created`).

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bps-jambi.go.id | Admin@BPS2024 |
| Petugas | wulanagusp@bps.go.id | Petugas@BPS2026 |
| ... 21 petugas lainnya | (lihat `scripts/seed-users.ts`) | Petugas@BPS2026 |

### 6. Jalankan Development Server
```bash
npm run dev
```
Buka `http://localhost:3000`.

---

## ✅ Checklist Verifikasi Setelah Setup

- [ ] `/` menampilkan landing page Simpatik (hero, fitur, profil BPS Kota Jambi)
- [ ] `/antrian` menampilkan form ambil antrian dengan jenis layanan dari seed — dan TIDAK muncul di menu navigasi publik manapun
- [ ] Ambil nomor antrian → redirect ke `/antrian/{kode}/tiket` dengan kode benar
- [ ] `/login` → login admin → redirect ke `/admin/dashboard`
- [ ] `/login` → login petugas → redirect ke `/petugas/dashboard`
- [ ] Admin coba akses `/petugas/dashboard` → redirect balik ke `/admin/dashboard`
- [ ] Petugas presensi masuk → jam yang tercatat sesuai WIB (bukan mundur/maju 7 jam)
- [ ] Buka `/display-antrian` di 2 tab; panggil antrian dari dashboard petugas di tab lain → tab display **update otomatis tanpa refresh** (Realtime)
- [ ] Selesaikan 1 antrian sebagai petugas → tombol "Beri Penilaian" muncul di halaman tiket
- [ ] Kirim pengaduan dengan lampiran → file bisa dibuka dari halaman detail admin
- [ ] Import Excel jadwal (format: `email_petugas, shift, tanggal`) di `/admin/jadwal`
- [ ] Kirim form di `/permintaan-data` → dapat link `/permintaan-data/lacak/{token}` di layar
- [ ] Petugas klik "Tindak Lanjuti" di permintaan tsb → buka link lacak dari tab lain → kirim pesan dari sisi petugas → muat ulang halaman lacak → pesan muncul di sisi pengunjung
- [ ] Petugas klik "Tandai Selesai" → buka lagi link lacak → kotak kirim pesan sudah hilang (percakapan ditutup)

---

## 💬 Chat/Lacak Permintaan Data — Cara Kerja & Keamanan

Setiap permintaan data dapat **token unik** (UUID acak, mustahil ditebak)
saat dibuat. Link `/permintaan-data/lacak/{token}` inilah yang jadi
"identitas" pengunjung untuk memantau & membalas tanpa perlu login.

**Kenapa aman dari kebocoran data pengunjung lain:**
Pengunjung publik **tidak pernah** diberi akses `SELECT` langsung ke tabel
`permintaan_data` atau `permintaan_data_pesan` — kalau diizinkan, siapa
pun bisa membaca **semua** data pengunjung lain lewat `anon key` tanpa
tahu token siapa pun. Sebagai gantinya, akses publik **hanya** lewat 2
function `SECURITY DEFINER` di database (`get_permintaan_data_publik`,
`kirim_pesan_pengunjung`) yang mewajibkan token persis sebagai parameter
— satu-satunya cara tahu token adalah menerima link-nya (di layar/email).

**Alur status:**
- `baru` → petugas klik "Tindak Lanjuti" (atau admin balas langsung, otomatis klaim)
- `diproses` → chat aktif, pengunjung & petugas bisa saling kirim pesan
- `selesai` → chat ditutup, pengunjung tidak bisa kirim pesan lagi (riwayat tetap bisa dibaca)

**Realtime**: pesan baru muncul otomatis di kedua sisi tanpa perlu
refresh — indikator titik hijau "Live" menandakan koneksi aktif. Dua
mekanisme berbeda dipakai sesuai model keamanan:
- **Sisi staf** (admin/petugas): Postgres Changes biasa (mereka sudah
  punya akses SELECT lewat RLS normal)
- **Sisi publik** (pengunjung via token): Broadcast from Database —
  trigger di database menyiarkan pesan baru ke topik privat bernama
  dari token itu sendiri, supaya publik tetap TIDAK PERNAH butuh akses
  SELECT langsung ke tabel manapun (lihat migration `0014_realtime_chat.sql`)

Tombol "Muat ulang" tetap tersedia sebagai jaring pengaman kalau koneksi
realtime sempat terputus.

---

## 💬 Chat/Lacak Pengaduan — Cara Kerja & Keamanan

Pola yang **identik** dengan chat permintaan data di atas, dengan satu
perbedaan penting: **pengaduan tetap sepenuhnya anonim**. Token akses
ditampilkan HANYA di layar setelah kirim (`/pengaduan/lacak/{token}`) —
**TIDAK PERNAH dikirim ke email**, karena pengaduan memang tidak meminta
email/kontak apa pun. Pengadu wajib menyimpan link itu sendiri.

Function `SECURITY DEFINER` yang dipakai: `get_pengaduan_publik`,
`kirim_pesan_pengadu` (lihat migration `0017_pengaduan_chat.sql`) — pola
keamanan token-only yang sama dengan permintaan data, tabel terpisah
(`pengaduan_pesan`), realtime lewat mekanisme yang sama (Postgres Changes
untuk admin, Broadcast from Database untuk publik via topik
`pengaduan:{token}`).

**Alur status:**
- `baru` → admin kirim balasan pertama (otomatis klaim, buka chat)
- `diproses` → chat aktif, pengadu & admin bisa saling kirim pesan
- `selesai` → chat ditutup, pengadu tidak bisa kirim pesan lagi (riwayat tetap bisa dibaca)

Pengiriman pengaduan awal (form) **tidak dibatasi** jam pelayanan —
masyarakat boleh mengadu kapan saja. Yang dibatasi jam pelayanan hanya
percakapan chat-nya, sama seperti permintaan data (lihat
`dalam_jam_pelayanan()` di migration `0016_jam_pelayanan_chat_form.sql`).

---

## 📧 Kirim Email untuk Permintaan Data — Dihapus

Sebelumnya link lacak permintaan data juga dikirim ke email pengunjung
lewat Resend, sebagai pelengkap tampilan di layar. Fitur ini **dihapus**
karena provider email (apa pun pilihannya — Resend, SendGrid, dsb)
mensyaratkan verifikasi domain untuk bisa kirim ke sembarang penerima,
yang membuatnya jadi titik kegagalan berulang untuk manfaat yang relatif
kecil (link di layar sudah cukup sebagai jalur utama, dan ada juga fitur
[cari ulang lewat email](#) di `/permintaan-data/cari` untuk yang lupa
menyimpan linknya).

Kalau suatu saat ingin diaktifkan lagi, riwayat implementasinya (`lib/email.ts`,
integrasi Resend) masih ada di riwayat git — tinggal dikembalikan dan
disesuaikan providernya.

---

## 📊 Import Excel — Jadwal Piket

Tombol **Download Template Excel** tersedia langsung di halaman `/admin/jadwal`
(mengunduh `public/templates/jadwal-template.xlsx`, lengkap dengan komentar
penjelas per kolom dan sheet "Petunjuk" terpisah).

Format kolom (sheet pertama, baris pertama = header):

| email_petugas | shift | tanggal |
|---|---|---|
| wulanagusp@bps.go.id | Pagi | 28/04/2026 |
| ari.hidayat@bps.go.id | Siang | 28/04/2026 |
| mahardika.usman@bps.go.id | Pagi | 29/04/2026 |

- Baris pertama (header) diabaikan otomatis
- **Dicocokkan lewat email**, bukan nama — email selalu unik dan tidak
  pernah mengandung koma/gelar, jauh lebih aman dibanding mencocokkan nama
- Tanggal format `DD/MM/YYYY`
- Hari Sabtu/Minggu otomatis dilewati
- Duplikat (petugas + shift + tanggal sama) otomatis dilewati
- Parsing file `.xlsx` dilakukan sepenuhnya di browser (library `xlsx`/SheetJS),
  tidak pernah diunggah sebagai file mentah ke server — hanya data yang
  sudah diparse yang dikirim ke Server Action

---

## 📄 Import CSV — Tambah Petugas Massal

Tombol **Import CSV** tersedia di halaman `/admin/petugas`, dengan tombol
**Template** di dalamnya (mengunduh `public/templates/petugas-template.csv`).

```csv
nama,email,password_opsional
"Ari Hidayat, SST",ari.hidayat@bps.go.id,
"Wulan Agus Pramita Sari, SST",wulanagusp@bps.go.id,
"Kiky Frisca, S.Si.",kiky.frisca@bps.go.id,RahasiaKhusus123
```

- Kolom `password_opsional` boleh dikosongkan — jika kosong, dipakai
  password default `Petugas@BPS2026` yang seragam untuk seluruh baris tanpa
  password. **Sampaikan ke petugas terkait untuk segera menggantinya**
  setelah login pertama.
- **Nama boleh mengandung koma** (gelar akademik) — WAJIB dibungkus tanda
  kutip ganda di file CSV, contoh: `"Ari Hidayat, SST"`. Kalau file dibuat
  lewat Excel (ketik nama apa adanya di sel, lalu *Save As → CSV*), Excel
  **otomatis** menambahkan tanda kutip ini sendiri — tidak perlu diketik manual.
- Email yang sudah terdaftar otomatis dilewati (tidak menimpa akun lama)
- Proses berjalan satu-per-satu (bukan batch) karena keterbatasan Supabase
  Auth Admin API — untuk puluhan akun, proses bisa memakan beberapa detik.

Kedua fitur import CSV di atas bisa dibuat/diedit langsung dari Excel:
**Save As → CSV (Comma delimited)**.

---

## 🔒 Row Level Security (RLS) — Ringkasan

Semua tabel punya RLS aktif. Poin penting yang perlu dipahami sebelum
menambah fitur baru:

- **`profiles`**: user hanya baca profil sendiri; admin baca/tulis semua
- **`antrian`**: publik (anon) boleh **insert & select** (perlu untuk ambil nomor + lihat tiket + display board tanpa login); hanya admin/petugas yang boleh **update** status
- **`pengaduan`**: publik boleh **insert** (anonim); hanya admin yang boleh baca & kelola
- **`jadwal_piket`**: publik boleh **select** (dipakai halaman jadwal publik); hanya pemilik jadwal (petugas) atau admin yang boleh update/insert/delete
- Helper function `current_role()` dipakai di hampir semua policy untuk mengecek role dari tabel `profiles`

Jika menambah tabel baru, **selalu aktifkan RLS** dan definisikan policy —
tabel tanpa RLS otomatis bisa diakses siapa saja lewat `anon key`.

---

## ♿ Mode Aksesibilitas

Widget mengambang (pojok kanan bawah, semua halaman — publik & area
login) di `components/AccessibilityWidget.tsx`, dipasang sekali di
`app/layout.tsx` sehingga otomatis tersedia di seluruh aplikasi.

- **Ukuran Teks** (Normal/Besar/Sangat Besar): mengubah `font-size` akar
  (`<html>`) lewat class `.ukuran-besar`/`.ukuran-sangat-besar` di
  `globals.css` — karena Tailwind default pakai satuan `rem`, ini otomatis
  menskalakan teks, spacing, DAN ukuran ikon di seluruh aplikasi secara
  proporsional, tanpa perlu ubah komponen satu-per-satu.
- **Kontras Tinggi**: filter CSS (`contrast` + `saturate`) broad-stroke
  di `<html>` lewat class `.kontras-tinggi` — pendekatan pragmatis,
  bukan perombakan warna di setiap komponen.

Preferensi disimpan di `localStorage` (aman untuk aplikasi Next.js
sungguhan seperti ini — beda dengan pembatasan localStorage yang berlaku
khusus di lingkungan artifact/sandbox chat).

---

## 🧩 Pola Kode yang Dipakai

- **Server Component** untuk halaman yang hanya menampilkan data (fetch langsung dari Supabase di server, tanpa API route terpisah)
- **Server Actions** (`'use server'`) untuk semua mutasi (create/update/delete) — dipanggil langsung dari `<form action={...}>` atau `startTransition()`
- **Client Component** hanya untuk bagian interaktif (modal, form dengan state, realtime subscription)
- **`useActionState`** untuk form dengan validasi & pesan error dari server
- **`revalidatePath()`** dipanggil di setiap Server Action agar data ter-refresh tanpa reload manual

---

*Simpatik — BPS Kota Jambi*
*Versi Next.js + Supabase — April 2026*

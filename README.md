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
│   ├── (publik)/              ← Route group, berbagi layout publik (tanpa login)
│   │   ├── page.tsx            → Ambil antrian (halaman utama "/")
│   │   ├── antrian/[kode]/tiket/page.tsx
│   │   ├── jadwal-petugas/page.tsx
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
| Petugas | budi.santoso@bps-jambi.go.id | password123 |
| ... 5 petugas lainnya | | password123 |

### 6. Jalankan Development Server
```bash
npm run dev
```
Buka `http://localhost:3000`.

---

## ✅ Checklist Verifikasi Setelah Setup

- [ ] `/` menampilkan form ambil antrian dengan jenis layanan dari seed
- [ ] Ambil nomor antrian → redirect ke `/antrian/{kode}/tiket` dengan kode benar
- [ ] `/login` → login admin → redirect ke `/admin/dashboard`
- [ ] `/login` → login petugas → redirect ke `/petugas/dashboard`
- [ ] Admin coba akses `/petugas/dashboard` → redirect balik ke `/admin/dashboard`
- [ ] Petugas presensi masuk → jam yang tercatat sesuai WIB (bukan mundur/maju 7 jam)
- [ ] Buka `/display-antrian` di 2 tab; panggil antrian dari dashboard petugas di tab lain → tab display **update otomatis tanpa refresh** (Realtime)
- [ ] Selesaikan 1 antrian sebagai petugas → tombol "Beri Penilaian" muncul di halaman tiket
- [ ] Kirim pengaduan dengan lampiran → file bisa dibuka dari halaman detail admin
- [ ] Import CSV jadwal (format: `nama_petugas,shift,tanggal`) di `/admin/jadwal`

---

## 📄 Format CSV Import Jadwal

```csv
nama_petugas,shift,tanggal
Budi Santoso,Pagi,28/04/2026
Siti Rahayu,Siang,28/04/2026
Ahmad Kurniawan,Pagi,29/04/2026
```

- Baris pertama (header) diabaikan otomatis
- Nama petugas harus sama persis dengan nama di tabel `profiles` (tidak case-sensitive)
- Tanggal format `DD/MM/YYYY`
- Hari Sabtu/Minggu otomatis dilewati
- Duplikat (petugas + shift + tanggal sama) otomatis dilewati

File CSV bisa dibuat/diedit langsung dari Excel: **Save As → CSV (Comma delimited)**.

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

## 🧩 Pola Kode yang Dipakai

- **Server Component** untuk halaman yang hanya menampilkan data (fetch langsung dari Supabase di server, tanpa API route terpisah)
- **Server Actions** (`'use server'`) untuk semua mutasi (create/update/delete) — dipanggil langsung dari `<form action={...}>` atau `startTransition()`
- **Client Component** hanya untuk bagian interaktif (modal, form dengan state, realtime subscription)
- **`useActionState`** untuk form dengan validasi & pesan error dari server
- **`revalidatePath()`** dipanggil di setiap Server Action agar data ter-refresh tanpa reload manual

---

*Simpatik — BPS Kota Jambi*
*Versi Next.js + Supabase — April 2026*

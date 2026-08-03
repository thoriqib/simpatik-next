# 🚀 Panduan Deploy — Simpatik (Next.js + Supabase)
### Target: Vercel + Supabase Cloud

---

## Daftar Isi
1. [Persiapan Supabase Cloud (Produksi)](#1-persiapan-supabase-cloud-produksi)
2. [Deploy ke Vercel](#2-deploy-ke-vercel)
3. [Konfigurasi Domain Kustom](#3-konfigurasi-domain-kustom-opsional)
4. [Buat Akun Admin & Petugas di Produksi](#4-buat-akun-admin--petugas-di-produksi)
5. [Checklist Setelah Deploy](#5-checklist-setelah-deploy)
6. [Update/Redeploy](#6-updateredeploy)
7. [Troubleshooting](#7-troubleshooting)
8. [Backup](#8-backup)

---

## 1. Persiapan Supabase Cloud (Produksi)

### Buat Project
1. [supabase.com](https://supabase.com) → **New Project**
2. Pilih region terdekat (Singapore — `ap-southeast-1` — paling dekat ke Indonesia, latensi terendah)
3. Catat **Database Password** yang dibuat (untuk akses langsung jika perlu)

### Jalankan Migration
Buka **SQL Editor** di dashboard project produksi, jalankan **berurutan**:
1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_seed.sql`

### Verifikasi Storage Bucket
Migration `0001_init.sql` sudah otomatis membuat bucket `pengaduan` (public).
Cek di **Storage** → pastikan bucket `pengaduan` muncul.

### Aktifkan Realtime untuk Tabel `antrian`
Sudah otomatis diaktifkan oleh baris `alter publication supabase_realtime add table public.antrian;`
di migration. Verifikasi di **Database → Replication** → pastikan tabel
`antrian` masuk daftar yang di-replicate.

### Catat Kredensial API
**Project Settings → API**:
- `Project URL` → jadi `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → jadi `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → jadi `SUPABASE_SERVICE_ROLE_KEY` (⚠️ rahasia)

---

## 2. Deploy ke Vercel

### Opsi A — Lewat Dashboard Vercel (termudah)
1. Push kode ke GitHub/GitLab/Bitbucket (buat repo baru jika belum ada)
2. [vercel.com](https://vercel.com) → **Add New Project** → import repo tersebut
3. Vercel otomatis mendeteksi Next.js — biarkan build command default (`next build`)
4. Sebelum klik **Deploy**, buka bagian **Environment Variables**, isi:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase produksi |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key produksi |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key produksi (⚠️ jangan pernah commit ke git) |
| `NEXT_PUBLIC_APP_NAME` | `Simpatik` |
| `NEXT_PUBLIC_APP_URL` | URL Vercel setelah deploy, misal `https://simpatik.vercel.app` |
| `TZ` | `Asia/Jakarta` |

5. Klik **Deploy**. Tunggu build selesai (~2-3 menit).

### Opsi B — Lewat Vercel CLI
```bash
npm install -g vercel
vercel login
cd simpatik-next
vercel

# Isi environment variables produksi
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_APP_NAME production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add TZ production

# Deploy ke produksi
vercel --prod
```

> ⚠️ **`SUPABASE_SERVICE_ROLE_KEY` harus HANYA diset sebagai environment
> variable server-side di Vercel** (bukan `NEXT_PUBLIC_*`). Variabel tanpa
> prefix `NEXT_PUBLIC_` otomatis tidak pernah dikirim ke browser — ini
> sudah benar di kode (`lib/supabase/admin.ts`), pastikan tidak diubah.

---

## 3. Konfigurasi Domain Kustom (Opsional)

Jika ingin diakses lewat domain BPS Kota Jambi alih-alih `*.vercel.app`:

### Rekomendasi: Subdomain, bukan Subdirectory
Berbeda dari versi Laravel yang di-deploy ke `statistik1571.my.id/simpatik`
(subdirectory), **Vercel bekerja paling baik dengan domain atau subdomain
penuh**, misalnya:
```
simpatik.statistik1571.my.id
```

### Langkah:
1. Di Vercel Dashboard → project Simpatik → **Settings → Domains** → tambahkan `simpatik.statistik1571.my.id`
2. Vercel akan menampilkan instruksi DNS. Umumnya:
   ```
   Type: CNAME
   Name: simpatik
   Value: cname.vercel-dns.com
   ```
3. Tambahkan record tersebut di pengaturan DNS domain `statistik1571.my.id`
   (di provider domain Anda, atau di panel DNS VPS jika dikelola sendiri)
4. Tunggu propagasi DNS (bisa 5 menit – 24 jam), Vercel otomatis menerbitkan SSL

> Jika **tetap ingin** subdirectory (`statistik1571.my.id/simpatik`), itu
> butuh reverse proxy tambahan (misal Nginx di VPS yang sudah ada, mem-proxy
> path `/simpatik` ke domain Vercel) — jauh lebih rumit dan menambah titik
> gagal. Subdomain jauh lebih direkomendasikan untuk arsitektur serverless
> seperti Vercel.

Setelah domain aktif, update environment variable:
```
NEXT_PUBLIC_APP_URL=https://simpatik.statistik1571.my.id
```
lalu redeploy agar perubahan terbaca.

---

## 4. Buat Akun Admin & Petugas di Produksi

Jalankan script seed **dari komputer lokal**, mengarah ke project Supabase
**produksi** (bukan lokal):

```bash
# Pastikan .env.local berisi kredensial project PRODUKSI, bukan development
npm run seed:users
```

Atau buat manual satu per satu lewat **Supabase Dashboard → Authentication
→ Users → Add User**, lalu jalankan SQL untuk set role:
```sql
update public.profiles set role = 'admin', name = 'Administrator Simpatik'
where email = 'admin@bps-jambi.go.id';
```

> ⚠️ **Segera ganti password default** setelah login pertama kali di produksi.

---

## 5. Checklist Setelah Deploy

- [ ] Buka URL produksi, halaman ambil antrian tampil dengan styling lengkap
- [ ] Login admin & petugas berhasil, redirect ke dashboard masing-masing
- [ ] Ambil nomor antrian dari device lain (HP) berhasil
- [ ] `/display-antrian` dibuka di 2 device berbeda → update realtime saat status antrian berubah
- [ ] Presensi masuk/keluar mencatat jam WIB yang akurat (cek `TZ=Asia/Jakarta` sudah terset di Vercel env)
- [ ] Upload lampiran pengaduan berhasil dan bisa dibuka kembali
- [ ] Cek Vercel → **Deployments → Functions logs** tidak ada error 500

---

## 6. Update/Redeploy

Karena Vercel terhubung ke Git, **setiap push ke branch utama otomatis
men-trigger deploy baru**:

```bash
git add .
git commit -m "Update fitur X"
git push origin main
```

Vercel akan build & deploy otomatis, dengan **zero-downtime** (deployment
lama tetap melayani traffic sampai yang baru siap sepenuhnya) — jauh lebih
sederhana dibanding proses `php artisan down` di VPS.

Jika ada migration SQL baru, jalankan manual di Supabase SQL Editor
**sebelum** kode baru yang bergantung padanya di-deploy.

### Rollback
Vercel Dashboard → **Deployments** → pilih deployment sebelumnya yang stabil
→ **Promote to Production**. Instan, tanpa perlu akses server manual.

---

## 7. Troubleshooting

**Redirect loop / tidak bisa login**
Cek `middleware.ts` — pastikan `NEXT_PUBLIC_SUPABASE_URL` dan
`NEXT_PUBLIC_SUPABASE_ANON_KEY` di Vercel env sesuai project produksi
(bukan tertukar dengan project development).

**Data tidak muncul / "permission denied" di UI**
Hampir selalu karena RLS policy. Cek dengan menjalankan query yang sama di
Supabase SQL Editor sebagai `service_role` (bypass RLS) — jika data ada di
situ tapi tidak muncul di app, berarti policy RLS untuk role terkait belum
sesuai. Cek ulang `supabase/migrations/0001_init.sql` bagian RLS.

**Presensi/jam tetap tidak akurat**
Pastikan environment variable `TZ=Asia/Jakarta` sudah diset di Vercel
(Settings → Environment Variables), lalu **redeploy** (env var baru tidak
berlaku otomatis ke deployment yang sudah berjalan).

**Display board tidak update realtime**
1. Cek **Database → Replication** di Supabase, pastikan tabel `antrian` aktif
2. Cek console browser (F12) — error terkait WebSocket berarti ada masalah
   koneksi Realtime (jarang, biasanya karena firewall/proxy klien)

**Upload lampiran pengaduan gagal**
Cek **Storage → pengaduan** di Supabase, pastikan bucket masih ada dan
policy `lampiran: publik bisa upload` masih aktif (Storage → Policies).

---

## 8. Backup

Supabase Cloud otomatis melakukan backup harian (tergantung plan — cek
**Project Settings → Database → Backups**). Untuk backup manual tambahan:

```bash
# Export skema + data via pg_dump (butuh connection string dari Supabase Dashboard)
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" > backup_simpatik_$(date +%Y%m%d).sql
```

Untuk file di Storage (lampiran pengaduan), unduh manual lewat Supabase
Dashboard → Storage, atau otomatisasi dengan Supabase Storage API.

---

*Panduan Deploy — Simpatik (Next.js + Supabase)*
*BPS Kota Jambi — April 2026*

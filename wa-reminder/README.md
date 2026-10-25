# Pengingat Piket WhatsApp — Simpatik

Kirim **satu pesan WhatsApp setiap pagi pukul 07.00 WIB** ke petugas yang punya jadwal piket hari itu.
Gratis (tanpa API berbayar). Jalan di VPS, **bukan** di Vercel — Vercel tidak cocok untuk koneksi WhatsApp yang harus tetap menyala.

Dilewati otomatis: Sabtu/Minggu, tanggal di tabel `hari_libur`, jadwal berstatus izin/sakit/alpha, dan petugas tanpa nomor.

> ⚠️ Memakai WhatsApp Web **tidak resmi** (library Baileys). Pakai **nomor khusus** (SIM/nomor kantor), jangan nomor pribadi.
> Volume kecil + jeda acak antar pesan membuat risiko blokir rendah, tapi tidak nol. Kalau WhatsApp mengubah protokolnya,
> library mungkin perlu di-update (`npm update @whiskeysockets/baileys`).

## 1. Siapkan database (sekali)
1. Jalankan `supabase/migrations/0027_profiles_no_hp.sql` di Supabase SQL Editor.
2. Login sebagai admin → menu **Nomor WhatsApp** → isi nomor tiap petugas → **Simpan Semua**.

## 2. Pasang di VPS (sekali)
Butuh Node.js 20+.
```bash
cd wa-reminder
cp .env.example .env      # isi NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY (sama seperti di Vercel)
npm install
```

## 3. Uji tanpa mengirim apa pun
```bash
npm run dry
```
Menampilkan siapa dapat pesan apa untuk hari ini (tidak login WhatsApp, tidak ada pesan terkirim).

## 4. Hubungkan WhatsApp (sekali)
```bash
npm start
```
Scan QR yang muncul di terminal dari nomor khusus: **WhatsApp → Perangkat Tertaut → Tautkan Perangkat**.
Setelah muncul `WhatsApp terhubung.`, sesi tersimpan di folder `auth/` (jangan dibagikan atau di-commit) dan tidak perlu scan lagi.

Uji kirim nyata (mengirim ke petugas yang terjadwal hari ini): `npm run sekarang`.

## 5. Jalankan permanen dengan PM2
```bash
npm install -g pm2
pm2 start index.js --name simpatik-wa
pm2 save
pm2 startup            # ikuti perintah yang ditampilkan agar hidup lagi setelah VPS restart
pm2 logs simpatik-wa   # lihat log
```
Layanan tetap tersambung dan mengirim otomatis tiap hari pukul 07.00 WIB. Ubah jam lewat `CRON_JADWAL` di `.env`
(format cron, zona WIB; contoh `30 6 * * *` = 06.30), lalu `pm2 restart simpatik-wa`.

## Catatan
- Pengiriman dicatat di folder `terkirim/` supaya tidak terkirim dobel di hari yang sama. Hapus file tanggal hari itu untuk kirim ulang.
- Isi `NOMOR_ADMIN_RINGKASAN` di `.env` kalau ingin dikabari ringkasan hasil kirim (siapa terkirim/gagal/belum punya nomor).
- Kalau muncul "Sesi WhatsApp keluar (logout)": hapus folder `auth/`, jalankan `npm start`, scan QR lagi.
- Kalau VPS mati tepat jam 07.00, pengingat hari itu tidak dikirim otomatis; jalankan `npm run sekarang` manual.

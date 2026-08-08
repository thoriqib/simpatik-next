-- ═══════════════════════════════════════════════════════════════
-- SEED DATA — Simpatik
-- Jalankan SETELAH 0001_init.sql dan SETELAH membuat akun admin
-- pertama secara manual (lihat DEPLOY.md bagian "Akun Admin Pertama")
-- karena auth.users hanya bisa diisi lewat Supabase Auth API,
-- bukan langsung lewat SQL INSERT biasa.
-- ═══════════════════════════════════════════════════════════════

-- ── Shift Piket ───────────────────────────────────────────────
insert into public.shift_piket (nama_shift, jam_mulai, jam_selesai, is_aktif) values
    ('Pagi',  '08:00', '12:00', true),
    ('Siang', '12:00', '16:00', true)
on conflict do nothing;

-- ── Jenis Layanan ─────────────────────────────────────────────
-- Hanya 3 kategori sesuai kebutuhan lapangan (warna tombol di UI:
-- biru = Pelayanan Statistik, hijau = Permintaan Informasi Publik,
-- oranye = Umum — lihat app/(publik)/AmbilAntrianForm.tsx)
insert into public.jenis_layanan (kode, nama_layanan, deskripsi, is_aktif) values
    ('A', 'Pelayanan Statistik',            'Konsultasi dan permintaan data/publikasi statistik BPS.', true),
    ('B', 'Permintaan Informasi Publik',    'Permintaan informasi publik sesuai UU Keterbukaan Informasi Publik.', true),
    ('C', 'Umum',                           'Keperluan umum lainnya di luar dua kategori di atas.', true)
on conflict (kode) do nothing;

-- ── Contoh Pengaduan (opsional, untuk demo) ──────────────────
insert into public.pengaduan (subjek, isi_pengaduan, status) values
    ('Waktu Tunggu Antrian Terlalu Lama', 'Saya sudah menunggu lebih dari 2 jam namun belum dipanggil. Mohon sistem antrian diperbaiki.', 'baru'),
    ('Ruang Tunggu Kurang Nyaman', 'AC di ruang tunggu tidak berfungsi dengan baik. Mohon segera diperbaiki.', 'baru')
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════════
-- CATATAN: Membuat akun Admin & Petugas
-- ═══════════════════════════════════════════════════════════════
-- Tabel auth.users dikelola oleh Supabase Auth, TIDAK BISA di-insert
-- langsung lewat SQL biasa. Gunakan salah satu cara berikut:
--
-- CARA 1 — Lewat Supabase Dashboard:
--   Authentication → Users → Add User → isi email & password
--   → centang "Auto Confirm User"
--   Lalu jalankan SQL berikut untuk set role & nama (ganti UUID hasil create):
--
--   update public.profiles
--   set role = 'admin', name = 'Administrator Simpatik'
--   where email = 'admin@bps-jambi.go.id';
--
-- CARA 2 — Lewat script seed (lihat scripts/seed-users.ts di paket ini)
--   yang otomatis membuat beberapa akun admin & petugas sekaligus
--   menggunakan Supabase Admin API (service role key).
-- ═══════════════════════════════════════════════════════════════

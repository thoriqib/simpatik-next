-- ═══════════════════════════════════════════════════════════════
-- UPDATE: Sederhanakan Jenis Layanan jadi 3 kategori
-- Jalankan file ini di Supabase SQL Editor jika project Anda SUDAH
-- pernah menjalankan 0002_seed.sql versi lama (5 kategori: A-E).
--
-- Aman dijalankan berkali-kali (idempotent). Kategori lama TIDAK
-- dihapus (menjaga integritas data antrian & laporan historis yang
-- sudah merujuk ke kode lama) — cukup dinonaktifkan, lalu kode A/B/C
-- diperbarui isinya jadi 3 kategori baru, dan kode D/E (jika ada)
-- otomatis nonaktif sehingga tidak muncul lagi di form ambil antrian.
-- ═══════════════════════════════════════════════════════════════

-- Nonaktifkan dulu SEMUA kategori yang ada saat ini
update public.jenis_layanan set is_aktif = false;

-- Masukkan/perbarui 3 kategori baru pada kode A, B, C
insert into public.jenis_layanan (kode, nama_layanan, deskripsi, is_aktif) values
    ('A', 'Pelayanan Statistik',         'Konsultasi dan permintaan data/publikasi statistik BPS.', true),
    ('B', 'Permintaan Informasi Publik', 'Permintaan informasi publik sesuai UU Keterbukaan Informasi Publik.', true),
    ('C', 'Umum',                        'Keperluan umum lainnya di luar dua kategori di atas.', true)
on conflict (kode) do update set
    nama_layanan = excluded.nama_layanan,
    deskripsi    = excluded.deskripsi,
    is_aktif     = excluded.is_aktif;

-- Verifikasi hasil (opsional, jalankan terpisah untuk mengecek)
-- select kode, nama_layanan, is_aktif from public.jenis_layanan order by kode;

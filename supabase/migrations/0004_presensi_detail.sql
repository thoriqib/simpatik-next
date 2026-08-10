-- ═══════════════════════════════════════════════════════════════
-- UPDATE: Detail perhitungan kekurangan jam presensi
-- Jalankan file ini di Supabase SQL Editor.
--
-- Sebelumnya kekurangan_menit dihitung sebagai:
--   durasi_shift - durasi_aktual (durasi keluar dikurangi durasi masuk)
-- Formula ini bisa "memaafkan" keterlambatan kalau petugas kerja lembur
-- (pulang lebih lambat dari jadwal), karena total durasi kerja jadi
-- tetap cukup/lebih meski datang terlambat.
--
-- Formula BARU (lebih tegas, sesuai kebijakan): keterlambatan dan
-- pulang-lebih-awal dihitung TERPISAH (masing-masing di-clamp ke 0,
-- tidak saling menutupi), baru dijumlahkan jadi kekurangan_menit.
-- ═══════════════════════════════════════════════════════════════

alter table public.presensi
    add column if not exists terlambat_menit   integer not null default 0,
    add column if not exists pulang_awal_menit integer not null default 0;

comment on column public.presensi.terlambat_menit is
    'Menit keterlambatan presensi masuk dari jam mulai shift (dihitung & disimpan saat presensi masuk, 0 jika tepat/lebih awal)';
comment on column public.presensi.pulang_awal_menit is
    'Menit pulang lebih awal dari jam selesai shift (dihitung & disimpan saat presensi keluar, 0 jika tepat/lebih lambat)';
comment on column public.presensi.kekurangan_menit is
    'Total kekurangan jam = terlambat_menit + pulang_awal_menit (dihitung ulang saat presensi keluar)';

-- Function lama (hitung_kekurangan_presensi) TIDAK dipakai lagi oleh
-- aplikasi — kalkulasi sekarang dilakukan langsung di Server Action
-- (lib/actions/presensi.ts) memakai formula baru di atas. Function lama
-- dibiarkan ada (tidak di-drop) agar tidak breaking jika ada pemakaian
-- lain, tapi bisa diabaikan.

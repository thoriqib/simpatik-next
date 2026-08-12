-- ═══════════════════════════════════════════════════════════════
-- FITUR BARU: Admin bisa mengubah status kehadiran (Izin/Sakit/Alpha)
-- dengan keterangan, langsung dari halaman Jadwal Piket.
-- Jalankan file ini di Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

alter table public.jadwal_piket
    add column if not exists keterangan text;

comment on column public.jadwal_piket.keterangan is 'Alasan/keterangan untuk status izin, sakit, atau alpha — diisi admin';

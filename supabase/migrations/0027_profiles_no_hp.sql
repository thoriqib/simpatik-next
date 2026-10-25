-- ═══════════════════════════════════════════════════════════════
-- FITUR BARU: Nomor WhatsApp petugas (untuk pengingat piket harian)
-- Jalankan file ini di Supabase SQL Editor.
--
-- Disimpan dalam format internasional tanpa tanda "+" (contoh:
-- 6281234567890). Kolom ini hanya dibaca oleh admin (RLS profiles yang
-- sudah ada) dan layanan pengirim di VPS (service role).
-- Kosong = petugas tidak dikirimi pengingat.
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles
    add column if not exists no_hp text;

comment on column public.profiles.no_hp is
    'Nomor WhatsApp format 62xxxxxxxxxx (tanpa +). NULL = tidak dikirimi pengingat piket.';

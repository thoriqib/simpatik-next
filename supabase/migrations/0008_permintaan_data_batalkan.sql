-- ═══════════════════════════════════════════════════════════════
-- UPDATE: Status "Dibatalkan" untuk Permintaan Data
-- Jalankan file ini di Supabase SQL Editor.
-- Memungkinkan admin membatalkan permintaan yang tidak relevan/valid/
-- duplikat, terpisah dari "selesai" (yang berarti benar-benar dilayani).
-- ═══════════════════════════════════════════════════════════════

alter table public.permintaan_data drop constraint if exists permintaan_data_status_check;

alter table public.permintaan_data add constraint permintaan_data_status_check
    check (status in ('baru', 'diproses', 'selesai', 'dibatalkan'));

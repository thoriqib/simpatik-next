-- ═══════════════════════════════════════════════════════════════
-- UPDATE: Status "Dibatalkan" untuk Permintaan Data
-- Jalankan file ini di Supabase SQL Editor.
-- Memungkinkan admin membatalkan permintaan yang tidak relevan/valid/
-- duplikat, terpisah dari "selesai" (yang berarti benar-benar dilayani).
--
-- ⚠️ CATATAN (setelah revisi lebih lanjut): aplikasi TIDAK LAGI memakai
-- nilai 'dibatalkan' secara aktif — "Batalkan" di UI sekarang mengembalikan
-- status ke 'diproses' (lihat lib/actions/permintaan-data.ts, function
-- batalkanPermintaanData). Constraint di bawah tetap dibiarkan mengizinkan
-- nilai 'dibatalkan' (tidak berbahaya dibiarkan ada, cuma tidak dipakai)
-- supaya migration ini tidak perlu di-rollback bagi yang sudah menjalankannya.
-- ═══════════════════════════════════════════════════════════════

alter table public.permintaan_data drop constraint if exists permintaan_data_status_check;

alter table public.permintaan_data add constraint permintaan_data_status_check
    check (status in ('baru', 'diproses', 'selesai', 'dibatalkan'));

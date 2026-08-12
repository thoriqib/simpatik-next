-- ═══════════════════════════════════════════════════════════════
-- UPDATE: Admin bisa membatalkan presensi petugas
-- Jalankan file ini di Supabase SQL Editor.
-- Sebelumnya admin hanya bisa SELECT presensi, sekarang bisa DELETE
-- juga (untuk membatalkan presensi yang salah/keliru diinput petugas).
-- ═══════════════════════════════════════════════════════════════

create policy "presensi: admin hapus (batalkan)" on public.presensi
    for delete using (app_role() = 'admin');

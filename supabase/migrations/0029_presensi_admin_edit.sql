-- Perbaikan: admin tidak bisa mengedit/mengisi presensi.
-- Akar masalah: tabel presensi hanya punya policy "petugas kelola milik sendiri" (untuk user_id sendiri),
-- "admin lihat semua" (SELECT) dan "admin hapus" (DELETE). Admin TIDAK punya izin INSERT/UPDATE,
-- jadi saat admin menyimpan koreksi: INSERT ditolak RLS, UPDATE diam-diam mengubah 0 baris
-- (tanpa error) — terlihat seperti "tidak bisa dientri" dan "jam pulang tidak bisa dikosongkan".
-- Jalankan di Supabase SQL Editor.

drop policy if exists "presensi: admin tambah" on public.presensi;
create policy "presensi: admin tambah" on public.presensi
    for insert to authenticated
    with check (app_role() = 'admin');

drop policy if exists "presensi: admin ubah" on public.presensi;
create policy "presensi: admin ubah" on public.presensi
    for update to authenticated
    using (app_role() = 'admin')
    with check (app_role() = 'admin');

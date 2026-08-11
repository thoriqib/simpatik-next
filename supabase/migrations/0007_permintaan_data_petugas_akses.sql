-- ═══════════════════════════════════════════════════════════════
-- UPDATE: Petugas bisa menindaklanjuti Permintaan Data
-- Jalankan file ini di Supabase SQL Editor.
--
-- Sebelumnya hanya admin yang boleh UPDATE permintaan_data. Sekarang
-- petugas juga boleh — supaya bisa klaim ("Tindak Lanjuti"), ambil
-- alih, dan menanggapi permintaan data pengunjung. Validasi SIAPA
-- yang boleh melakukan aksi apa (klaim vs sudah jadi penanggung jawab
-- orang lain, dsb) dilakukan di level Server Action, bukan RLS —
-- konsisten dengan pola kepercayaan staf internal di seluruh aplikasi
-- ini (petugas juga bebas kelola status antrian, presensi sendiri, dsb).
-- ═══════════════════════════════════════════════════════════════

drop policy if exists "permintaan_data: admin kelola" on public.permintaan_data;

create policy "permintaan_data: admin & petugas kelola" on public.permintaan_data
    for update using (app_role() in ('admin', 'petugas'));

-- Hapus tetap khusus admin (tidak berubah)

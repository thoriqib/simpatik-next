-- ═══════════════════════════════════════════════════════════════
-- FIX: RLS INSERT Pengaduan Gagal (error 42501)
-- Jalankan file ini di Supabase SQL Editor.
--
-- Gejala: kirim pengaduan gagal dengan error "new row violates
-- row-level security policy for table pengaduan" (kode 42501).
--
-- Penyebab: policy "pengaduan: publik insert (anonim)" yang mengizinkan
-- siapa pun (anon) insert ke tabel pengaduan sepertinya tidak pernah
-- berhasil dibuat di database ini, atau sempat terhapus. Migration ini
-- aman dijalankan berapa kali pun (drop dulu kalau ada, baru buat ulang)
-- — tidak akan error meski policy-nya sudah/belum ada sebelumnya.
-- ═══════════════════════════════════════════════════════════════

drop policy if exists "pengaduan: publik insert (anonim)" on public.pengaduan;

create policy "pengaduan: publik insert (anonim)" on public.pengaduan
    for insert
    to anon, authenticated
    with check (true);

-- ── Diagnostik: jalankan query ini SETELAH migration di atas untuk
-- konfirmasi hasilnya — harus muncul 2 baris: satu untuk INSERT (anon
-- boleh), satu untuk ALL (admin kelola). ──────────────────────────
-- select polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr,
--        pg_get_expr(polwithcheck, polrelid) as check_expr
-- from pg_policy
-- where polrelid = 'public.pengaduan'::regclass;

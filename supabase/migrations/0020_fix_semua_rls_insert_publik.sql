-- ═══════════════════════════════════════════════════════════════
-- FIX: RLS INSERT Publik Gagal — Pola Sistemik (kode error 42501)
-- Jalankan file ini di Supabase SQL Editor.
--
-- Setelah menemukan & memperbaiki bug ini di tabel `pengaduan`
-- (migration 0019), ditemukan pola SERUPA di 3 policy lain: dibuat
-- TANPA klausa `to anon, authenticated` eksplisit. Migration ini
-- memperbaiki semuanya sekaligus, sebelum sempat dilaporkan satu-satu:
--
-- 1. permintaan_data: publik insert  → SUDAH DILAPORKAN gagal
-- 2. penilaian: publik insert        → insert LANGSUNG lewat JS client,
--                                       beresiko sama (belum tentu
--                                       dilaporkan, tapi proaktif diperbaiki)
-- 3. antrian: publik bisa insert     → insert-nya lewat SECURITY DEFINER
--                                       function (ambil_nomor_antrian),
--                                       yang BYPASS RLS sepenuhnya — jadi
--                                       kemungkinan besar TIDAK terdampak,
--                                       tapi tetap diperbaiki untuk
--                                       konsistensi & jaga-jaga kalau ada
--                                       kode lain yang insert langsung.
--
-- Migration ini AMAN dijalankan berapa kali pun (drop dulu kalau ada,
-- baru buat ulang) — tidak akan error meski policy sudah/belum ada.
-- ═══════════════════════════════════════════════════════════════

drop policy if exists "permintaan_data: publik insert" on public.permintaan_data;
create policy "permintaan_data: publik insert" on public.permintaan_data
    for insert
    to anon, authenticated
    with check (true);

drop policy if exists "penilaian: publik insert" on public.penilaian;
create policy "penilaian: publik insert" on public.penilaian
    for insert
    to anon, authenticated
    with check (true);

drop policy if exists "antrian: publik bisa insert" on public.antrian;
create policy "antrian: publik bisa insert" on public.antrian
    for insert
    to anon, authenticated
    with check (true);

-- ── Diagnostik: jalankan query ini SETELAH migration di atas untuk
-- lihat SEMUA policy insert publik yang ada sekarang, lengkap dengan
-- role targetnya. Kolom "roles" harus berisi {anon,authenticated} untuk
-- ketiga baris di atas. ────────────────────────────────────────────
-- select tablename, policyname, roles, cmd
-- from pg_policies
-- where schemaname = 'public'
--   and policyname ilike '%publik insert%' or policyname ilike '%publik bisa insert%'
-- order by tablename;

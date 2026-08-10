-- ═══════════════════════════════════════════════════════════════
-- FITUR BARU: Hari Libur Nasional
-- Jalankan file ini di Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.hari_libur (
    id          bigint generated always as identity primary key,
    tanggal     date not null unique,
    keterangan  text not null, -- contoh: "Hari Buruh", "Maulid Nabi Muhammad SAW"
    created_at  timestamptz not null default now()
);

comment on table public.hari_libur is 'Keterangan hari libur nasional, dipakai di halaman jadwal petugas (publik & admin)';

alter table public.hari_libur enable row level security;

create policy "hari_libur: publik bisa lihat" on public.hari_libur
    for select using (true);

create policy "hari_libur: admin kelola penuh" on public.hari_libur
    for all using (app_role() = 'admin');

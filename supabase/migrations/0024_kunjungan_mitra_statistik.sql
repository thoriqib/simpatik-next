-- ═══════════════════════════════════════════════════════════════
-- FITUR BARU: Kunjungan Mitra Statistik
-- Jalankan file ini di Supabase SQL Editor.
--
-- Berbeda dari antrian biasa — Mitra Statistik TIDAK dapat nomor urut,
-- TIDAK melalui alur status (menunggu/dipanggil/dilayani/selesai), dan
-- TIDAK diminta mengisi penilaian kepuasan. Cukup catat nama, no HP,
-- dan keperluan kunjungan. Karena semantiknya beda total dari antrian
-- (yang seluruh modelnya berpusat di nomor urut & status layanan),
-- dibuat tabel & alur terpisah — bukan dipaksakan ke tabel `antrian`
-- yang sudah ada, supaya tidak mengotori model data antrian dengan
-- kasus yang secara konsep berbeda.
-- ═══════════════════════════════════════════════════════════════

create table public.kunjungan_mitra (
    id          bigint generated always as identity primary key,
    nama        text not null,
    no_hp       text not null,
    keperluan   text not null,
    dicatat_oleh uuid references public.profiles(id), -- diisi kalau dicatat petugas langsung (opsional)
    created_at  timestamptz not null default now()
);

create index idx_kunjungan_mitra_created_at on public.kunjungan_mitra(created_at);

alter table public.kunjungan_mitra enable row level security;

-- Publik (anon) boleh insert — sama seperti antrian biasa, form ini
-- terbuka tanpa login di ruang pelayanan.
create policy "kunjungan_mitra: publik insert" on public.kunjungan_mitra
    for insert
    to anon, authenticated
    with check (true);

-- Admin & petugas boleh lihat semua — konsisten dengan antrian yang
-- juga bisa dilihat admin & petugas (bukan cuma admin).
create policy "kunjungan_mitra: admin petugas lihat" on public.kunjungan_mitra
    for select
    to authenticated
    using (app_role() in ('admin', 'petugas'));

-- Admin boleh hapus (kalau ada input keliru) — konsisten dengan pola
-- "admin bisa batalkan/hapus" di fitur lain (antrian, presensi).
create policy "kunjungan_mitra: admin hapus" on public.kunjungan_mitra
    for delete
    to authenticated
    using (app_role() = 'admin');

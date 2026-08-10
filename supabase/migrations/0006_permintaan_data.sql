-- ═══════════════════════════════════════════════════════════════
-- FITUR BARU: Form Permintaan Data Pengunjung
-- Pengganti Google Form "Permintaan Data Pengunjung Pelayanan
-- Statistik Terpadu BPS Kota Jambi" — diisi publik tanpa login.
-- Jalankan file ini di Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.permintaan_data (
    id                bigint generated always as identity primary key,
    nama_lengkap      text not null,
    instansi          text not null,
    kegunaan_data     text not null check (kegunaan_data in ('kedinasan', 'pribadi')),
    email             text not null,
    no_hp             text not null,
    kebutuhan_data    text not null,
    status            text not null default 'baru' check (status in ('baru', 'diproses', 'selesai')),
    tanggapan         text,
    ditangani_oleh    uuid references public.profiles(id),
    ditanggapi_pada   timestamptz,
    created_at        timestamptz not null default now()
);

comment on table public.permintaan_data is 'Form permintaan/konsultasi data dari pengunjung publik, tanpa login (pengganti Google Form)';
comment on column public.permintaan_data.kegunaan_data is 'kedinasan = Kedinasan/Pekerjaan, pribadi = Pribadi/Tugas Sekolah/Kuliah/Skripsi';

create index if not exists idx_permintaan_data_status on public.permintaan_data(status);
create index if not exists idx_permintaan_data_created on public.permintaan_data(created_at desc);

alter table public.permintaan_data enable row level security;

-- Publik HANYA boleh INSERT — tidak boleh SELECT/UPDATE/DELETE sama
-- sekali, supaya data pengunjung lain (email, no HP, dsb) tidak bisa
-- dibaca siapa pun lewat anon key. Ini beda dari tabel `antrian` yang
-- memang butuh select publik untuk fitur display board.
create policy "permintaan_data: publik insert" on public.permintaan_data
    for insert with check (true);

-- Admin & petugas boleh lihat semua data masuk
create policy "permintaan_data: admin & petugas lihat" on public.permintaan_data
    for select using (app_role() in ('admin', 'petugas'));

-- Hanya admin yang boleh menanggapi/ubah status/hapus
create policy "permintaan_data: admin kelola" on public.permintaan_data
    for update using (app_role() = 'admin');

create policy "permintaan_data: admin hapus" on public.permintaan_data
    for delete using (app_role() = 'admin');

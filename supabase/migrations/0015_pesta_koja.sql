-- ═══════════════════════════════════════════════════════════════
-- FITUR BARU: Pesta Koja (Pelayanan Statistik Kota Jambi)
-- Microsite publik berisi daftar link ke layanan-layanan BPS Kota
-- Jambi, isinya sepenuhnya bisa diatur admin (tambah/edit/hapus/urutkan).
-- Jalankan file ini di Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.pesta_koja_link (
    id          bigint generated always as identity primary key,
    judul       text not null unique,
    deskripsi   text not null,
    url         text not null,
    ikon        text not null default 'link', -- kunci ke peta ikon di frontend (lucide-react)
    urutan      integer not null default 0,
    is_aktif    boolean not null default true,
    created_at  timestamptz not null default now()
);

create index if not exists idx_pesta_koja_urutan on public.pesta_koja_link(urutan);

alter table public.pesta_koja_link enable row level security;

-- Publik hanya lihat yang aktif; admin lihat semua (termasuk nonaktif, untuk dikelola)
create policy "pesta_koja: lihat" on public.pesta_koja_link
    for select using (is_aktif = true or app_role() = 'admin');

create policy "pesta_koja: admin tambah" on public.pesta_koja_link
    for insert with check (app_role() = 'admin');

create policy "pesta_koja: admin ubah" on public.pesta_koja_link
    for update using (app_role() = 'admin');

create policy "pesta_koja: admin hapus" on public.pesta_koja_link
    for delete using (app_role() = 'admin');

-- ── Data awal sesuai daftar yang diberikan ──────────────────────
insert into public.pesta_koja_link (judul, deskripsi, url, ikon, urutan) values
    ('PANDAWA (Pelayanan Data Via WA)', 'Konsultasi Statistik secara daring dengan Petugas Pelayanan BPS Kota Jambi melalui Whatsapp.', 'https://wa.me/+6282188880571?text=Halo%20BPS%20Kota%20Jambi.%20Saya%20ingin%20konsultasi%20statistik', 'message-circle', 1),
    ('Perpustakaan', 'Akses publikasi BPS secara daring.', 'https://perpustakaan.bps.go.id/opac/', 'book-open', 2),
    ('Romantik (Rekomendasi Statistik)', 'Dapatkan rekomendasi kegiatan statistik dengan mudah secara daring.', 'https://romantik.web.bps.go.id/', 'check-circle', 3),
    ('Silastik (Sistem Informasi Layanan Statistik)', 'Pembelian data mikro dan peta wilayah kerja statistik.', 'https://silastik.bps.go.id/v3/index.php', 'database', 4),
    ('Survei Kebutuhan Data', 'Berikan penilaian untuk Pelayanan Statistik Terpadu BPS Kota Jambi melalui Survei Kebutuhan Data (SKD).', 'https://skd.bps.go.id/skd/s/1571', 'clipboard-list', 5),
    ('Pejabat Pengelola Informasi & Dokumentasi (PPID)', 'BPS Kota Jambi merupakan badan publik. Dapatkan informasi publik melalui website PPID.', 'https://ppid.bps.go.id/?mfd=0000', 'users', 6),
    ('Pengajuan Informasi Publik', 'Ajukan informasi publik melalui website PPID.', 'https://ppid.bps.go.id/app/pengajuan_informasi', 'file-text', 7),
    ('Pengaduan & Whistleblowing System', 'Sampaikan keluhan mengenai pelayanan kami.', 'https://simpatik-zeta.vercel.app/pengaduan', 'alert-triangle', 8)
on conflict (judul) do nothing;

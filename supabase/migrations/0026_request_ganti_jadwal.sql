-- ═══════════════════════════════════════════════════════════════
-- FITUR BARU: Request Ganti Jadwal/Shift Piket
-- Jalankan file ini di Supabase SQL Editor.
--
-- Alur: petugas yang berhalangan mengajukan request atas SATU jadwal
-- piket miliknya yang belum berjalan, dengan dua pilihan:
--   • 'pindah'     — jadwalnya dipindah ke tanggal/shift lain (milik dia sendiri)
--   • 'digantikan' — jadwalnya diambil alih petugas lain (pengganti)
-- Admin menyetujui/menolak. Saat DISETUJUI, jadwal_piket diubah oleh
-- server action (lib/actions/ganti-jadwal.ts) — bukan trigger — supaya
-- validasi bentrok/jadwal sudah berjalan bisa memberi pesan yang jelas.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.request_ganti_jadwal (
    id               bigint generated always as identity primary key,
    jadwal_piket_id  bigint not null references public.jadwal_piket(id) on delete cascade,
    pemohon_id       uuid   not null references public.profiles(id) on delete cascade,
    jenis            text   not null check (jenis in ('pindah', 'digantikan')),
    tanggal_baru     date,
    shift_baru_id    bigint references public.shift_piket(id),
    pengganti_id     uuid   references public.profiles(id),
    alasan           text   not null,
    status           text   not null default 'menunggu'
                     check (status in ('menunggu', 'disetujui', 'ditolak', 'dibatalkan')),
    catatan_admin    text,
    diputuskan_oleh  uuid   references public.profiles(id),
    diputuskan_at    timestamptz,
    created_at       timestamptz not null default now(),
    -- 'pindah' wajib punya tanggal+shift baru; 'digantikan' wajib punya pengganti
    constraint chk_request_ganti_target check (
        (jenis = 'pindah'     and tanggal_baru is not null and shift_baru_id is not null and pengganti_id is null)
     or (jenis = 'digantikan' and pengganti_id is not null and tanggal_baru is null and shift_baru_id is null)
    )
);

comment on table public.request_ganti_jadwal is
    'Request petugas untuk memindah/menggantikan jadwal piket miliknya, menunggu persetujuan admin';

create index if not exists idx_request_ganti_status on public.request_ganti_jadwal(status, created_at desc);
create index if not exists idx_request_ganti_pemohon on public.request_ganti_jadwal(pemohon_id);

-- Satu jadwal hanya boleh punya SATU request yang masih menunggu
create unique index if not exists uniq_request_ganti_menunggu
    on public.request_ganti_jadwal(jadwal_piket_id)
    where status = 'menunggu';

alter table public.request_ganti_jadwal enable row level security;

-- Pemohon: lihat request miliknya sendiri
create policy "request_ganti: pemohon lihat milik sendiri" on public.request_ganti_jadwal
    for select using (auth.uid() = pemohon_id);

-- Pemohon: ajukan request atas nama sendiri, selalu berstatus 'menunggu'
create policy "request_ganti: petugas ajukan" on public.request_ganti_jadwal
    for insert with check (
        auth.uid() = pemohon_id
        and status = 'menunggu'
        and app_role() in ('petugas', 'admin')
    );

-- Pemohon: hanya boleh membatalkan request miliknya yang masih menunggu
create policy "request_ganti: pemohon batalkan" on public.request_ganti_jadwal
    for update
    using (auth.uid() = pemohon_id and status = 'menunggu')
    with check (auth.uid() = pemohon_id and status = 'dibatalkan');

-- Admin: kelola penuh (lihat semua, setujui, tolak)
create policy "request_ganti: admin kelola penuh" on public.request_ganti_jadwal
    for all using (app_role() = 'admin');

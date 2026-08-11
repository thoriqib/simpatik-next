-- ═══════════════════════════════════════════════════════════════
-- SIMPATIK — Sistem Informasi Pelayanan Statistik
-- Skema Database Supabase (Postgres)
-- BPS Kota Jambi
-- ═══════════════════════════════════════════════════════════════
-- Jalankan file ini di Supabase SQL Editor, atau via:
--   supabase db push
-- ═══════════════════════════════════════════════════════════════

-- ── Ekstensi ──────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Timezone default koneksi (WIB) ───────────────────────────
alter database postgres set timezone to 'Asia/Jakarta';

-- ═══════════════════════════════════════════════════════════════
-- TABEL: profiles
-- Menghubungkan auth.users (Supabase Auth) dengan role aplikasi.
-- Baris dibuat otomatis via trigger saat user baru dibuat.
-- ═══════════════════════════════════════════════════════════════
create table public.profiles (
    id          uuid primary key references auth.users(id) on delete cascade,
    name        text not null,
    email       text not null,
    role        text not null check (role in ('admin', 'petugas')),
    created_at  timestamptz not null default now()
);

comment on table public.profiles is 'Profil & role user, 1:1 dengan auth.users';

-- Trigger: buat profile otomatis saat user baru dibuat via Supabase Auth
-- Role & name diambil dari raw_user_meta_data (diisi saat admin membuat akun petugas)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, name, email, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'petugas')
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Helper function untuk RLS: ambil role user yang sedang login
create or replace function public.app_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
    select role from public.profiles where id = auth.uid();
$$;

-- ═══════════════════════════════════════════════════════════════
-- TABEL: shift_piket
-- ═══════════════════════════════════════════════════════════════
create table public.shift_piket (
    id           bigint generated always as identity primary key,
    nama_shift   text not null,
    jam_mulai    time not null,
    jam_selesai  time not null,
    is_aktif     boolean not null default true,
    created_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- TABEL: jenis_layanan
-- ═══════════════════════════════════════════════════════════════
create table public.jenis_layanan (
    id            bigint generated always as identity primary key,
    kode          text not null unique,
    nama_layanan  text not null,
    deskripsi     text,
    is_aktif      boolean not null default true,
    created_at    timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- TABEL: jadwal_piket
-- ═══════════════════════════════════════════════════════════════
create table public.jadwal_piket (
    id          bigint generated always as identity primary key,
    user_id     uuid not null references public.profiles(id) on delete cascade,
    shift_id    bigint not null references public.shift_piket(id),
    tanggal     date not null,
    status      text not null default 'terjadwal'
                check (status in ('terjadwal','hadir','izin','sakit','alpha')),
    created_at  timestamptz not null default now(),
    unique (user_id, tanggal, shift_id)
);

create index idx_jadwal_tanggal on public.jadwal_piket(tanggal);
create index idx_jadwal_user on public.jadwal_piket(user_id);

-- ═══════════════════════════════════════════════════════════════
-- TABEL: presensi
-- ═══════════════════════════════════════════════════════════════
create table public.presensi (
    id                  bigint generated always as identity primary key,
    user_id             uuid not null references public.profiles(id) on delete cascade,
    jadwal_piket_id     bigint not null references public.jadwal_piket(id) on delete cascade,
    waktu_masuk         timestamptz,
    waktu_keluar        timestamptz,
    terlambat_menit     integer not null default 0, -- menit terlambat masuk dari jam mulai shift
    pulang_awal_menit   integer not null default 0, -- menit pulang lebih awal dari jam selesai shift
    kekurangan_menit    integer not null default 0, -- total = terlambat_menit + pulang_awal_menit
    created_at          timestamptz not null default now(),
    unique (jadwal_piket_id)
);

-- ═══════════════════════════════════════════════════════════════
-- TABEL: antrian
-- ═══════════════════════════════════════════════════════════════
create table public.antrian (
    id                     bigint generated always as identity primary key,
    kode_antrian           text not null,
    jenis_layanan_id       bigint not null references public.jenis_layanan(id),
    petugas_id             uuid references public.profiles(id),
    nama_pengunjung        text not null,
    no_hp                  text,
    email                  text,
    tanggal                date not null default (now() at time zone 'Asia/Jakarta')::date,
    nomor_urut             integer not null,
    status                 text not null default 'menunggu'
                           check (status in ('menunggu','dipanggil','dilayani','selesai','batal')),
    waktu_panggil          timestamptz,
    waktu_mulai_layanan    timestamptz,
    waktu_selesai          timestamptz,
    created_at             timestamptz not null default now()
);

create index idx_antrian_tanggal on public.antrian(tanggal);
create index idx_antrian_status on public.antrian(status);
create index idx_antrian_kode on public.antrian(kode_antrian, tanggal);

-- ═══════════════════════════════════════════════════════════════
-- TABEL: penilaian
-- ═══════════════════════════════════════════════════════════════
create table public.penilaian (
    id           bigint generated always as identity primary key,
    antrian_id   bigint not null unique references public.antrian(id) on delete cascade,
    petugas_id   uuid not null references public.profiles(id),
    nilai        smallint not null check (nilai between 1 and 5),
    komentar     text,
    created_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- TABEL: pengaduan (anonim — tanpa identitas pelapor)
-- ═══════════════════════════════════════════════════════════════
create table public.pengaduan (
    id                bigint generated always as identity primary key,
    subjek            text not null,
    isi_pengaduan     text not null,
    lampiran_path     text,
    status            text not null default 'baru'
                      check (status in ('baru','diproses','selesai')),
    tanggapan         text,
    ditangani_oleh    uuid references public.profiles(id),
    ditanggapi_pada   timestamptz,
    created_at        timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: generate kode antrian otomatis (server-side, atomic)
-- Dipanggil dari Server Action saat pengunjung ambil nomor antrian.
-- Pakai advisory lock supaya aman dari race condition nomor ganda.
-- ═══════════════════════════════════════════════════════════════
create or replace function public.ambil_nomor_antrian(
    p_jenis_layanan_id bigint,
    p_nama text,
    p_no_hp text,
    p_email text
)
returns public.antrian
language plpgsql
security definer
set search_path = public
as $$
declare
    v_kode_layanan text;
    v_nomor_baru   integer;
    v_kode_antrian text;
    v_hasil        public.antrian;
begin
    -- Lock berbasis jenis layanan agar nomor urut tidak bentrok
    perform pg_advisory_xact_lock(p_jenis_layanan_id);

    select kode into v_kode_layanan from jenis_layanan where id = p_jenis_layanan_id and is_aktif = true;
    if v_kode_layanan is null then
        raise exception 'Jenis layanan tidak ditemukan atau tidak aktif';
    end if;

    select coalesce(max(nomor_urut), 0) + 1 into v_nomor_baru
    from antrian
    where jenis_layanan_id = p_jenis_layanan_id
      and tanggal = (now() at time zone 'Asia/Jakarta')::date;

    v_kode_antrian := v_kode_layanan || lpad(v_nomor_baru::text, 3, '0');

    insert into antrian (kode_antrian, jenis_layanan_id, nama_pengunjung, no_hp, email, nomor_urut, tanggal)
    values (v_kode_antrian, p_jenis_layanan_id, p_nama, p_no_hp, p_email, v_nomor_baru,
            (now() at time zone 'Asia/Jakarta')::date)
    returning * into v_hasil;

    return v_hasil;
end;
$$;

grant execute on function public.ambil_nomor_antrian to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: hitung kekurangan jam presensi
-- ═══════════════════════════════════════════════════════════════
create or replace function public.hitung_kekurangan_presensi(p_presensi_id bigint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_masuk    timestamptz;
    v_keluar   timestamptz;
    v_jam_mulai time;
    v_jam_selesai time;
    v_durasi_shift integer;
    v_durasi_aktual integer;
begin
    select p.waktu_masuk, p.waktu_keluar, s.jam_mulai, s.jam_selesai
    into v_masuk, v_keluar, v_jam_mulai, v_jam_selesai
    from presensi p
    join jadwal_piket j on j.id = p.jadwal_piket_id
    join shift_piket s on s.id = j.shift_id
    where p.id = p_presensi_id;

    if v_masuk is null or v_keluar is null then
        return 0;
    end if;

    v_durasi_shift := extract(epoch from (v_jam_selesai - v_jam_mulai)) / 60;
    v_durasi_aktual := extract(epoch from (v_keluar - v_masuk)) / 60;

    return greatest(0, v_durasi_shift - v_durasi_aktual);
end;
$$;

grant execute on function public.hitung_kekurangan_presensi to authenticated;

-- ═══════════════════════════════════════════════════════════════
-- VIEW PUBLIK: jadwal petugas (tanpa login)
-- Hanya expose kolom yang aman untuk publik (nama, bukan email/id auth)
-- ═══════════════════════════════════════════════════════════════
create or replace view public.v_jadwal_publik as
select
    j.id,
    j.tanggal,
    j.status,
    p.name as nama_petugas,
    s.id as shift_id,
    s.nama_shift,
    s.jam_mulai,
    s.jam_selesai
from jadwal_piket j
join profiles p on p.id = j.user_id
join shift_piket s on s.id = j.shift_id;

grant select on public.v_jadwal_publik to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.shift_piket enable row level security;
alter table public.jenis_layanan enable row level security;
alter table public.jadwal_piket enable row level security;
alter table public.presensi enable row level security;
alter table public.antrian enable row level security;
alter table public.penilaian enable row level security;
alter table public.pengaduan enable row level security;

-- ── profiles ──────────────────────────────────────────────────
create policy "profiles: user lihat profil sendiri" on public.profiles
    for select using (auth.uid() = id);
create policy "profiles: admin lihat semua" on public.profiles
    for select using (app_role() = 'admin');
create policy "profiles: admin update semua" on public.profiles
    for update using (app_role() = 'admin');

-- ── shift_piket ───────────────────────────────────────────────
create policy "shift: publik lihat yang aktif" on public.shift_piket
    for select using (is_aktif = true or app_role() = 'admin');
create policy "shift: admin kelola" on public.shift_piket
    for all using (app_role() = 'admin');

-- ── jenis_layanan ─────────────────────────────────────────────
create policy "layanan: publik lihat yang aktif" on public.jenis_layanan
    for select using (is_aktif = true or app_role() = 'admin');
create policy "layanan: admin kelola" on public.jenis_layanan
    for all using (app_role() = 'admin');

-- ── jadwal_piket ──────────────────────────────────────────────
create policy "jadwal: publik bisa lihat (untuk halaman jadwal publik)" on public.jadwal_piket
    for select using (true);
create policy "jadwal: admin kelola penuh" on public.jadwal_piket
    for all using (app_role() = 'admin');
create policy "jadwal: petugas update status milik sendiri" on public.jadwal_piket
    for update using (auth.uid() = user_id and app_role() = 'petugas');

-- ── presensi ──────────────────────────────────────────────────
create policy "presensi: petugas kelola milik sendiri" on public.presensi
    for all using (auth.uid() = user_id);
create policy "presensi: admin lihat semua" on public.presensi
    for select using (app_role() = 'admin');

-- ── antrian ───────────────────────────────────────────────────
-- Publik (anon) perlu insert (ambil nomor) & select (tiket/display board)
create policy "antrian: publik bisa lihat" on public.antrian
    for select using (true);
create policy "antrian: publik bisa insert" on public.antrian
    for insert with check (true);
create policy "antrian: petugas & admin update" on public.antrian
    for update using (app_role() in ('admin','petugas'));

-- ── penilaian ─────────────────────────────────────────────────
create policy "penilaian: publik bisa lihat & insert" on public.penilaian
    for select using (true);
create policy "penilaian: publik insert" on public.penilaian
    for insert with check (true);
create policy "penilaian: admin hapus" on public.penilaian
    for delete using (app_role() = 'admin');

-- ── pengaduan ─────────────────────────────────────────────────
create policy "pengaduan: publik insert (anonim)" on public.pengaduan
    for insert with check (true);
create policy "pengaduan: admin kelola penuh" on public.pengaduan
    for all using (app_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKET: lampiran pengaduan
-- ═══════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('pengaduan', 'pengaduan', true)
on conflict (id) do nothing;

create policy "lampiran: publik bisa upload"
    on storage.objects for insert
    with check (bucket_id = 'pengaduan');

create policy "lampiran: publik bisa lihat"
    on storage.objects for select
    using (bucket_id = 'pengaduan');

-- ═══════════════════════════════════════════════════════════════
-- TABEL: hari_libur
-- Keterangan hari libur nasional, dipakai di halaman jadwal petugas.
-- ═══════════════════════════════════════════════════════════════
create table public.hari_libur (
    id          bigint generated always as identity primary key,
    tanggal     date not null unique,
    keterangan  text not null,
    created_at  timestamptz not null default now()
);

alter table public.hari_libur enable row level security;

create policy "hari_libur: publik bisa lihat" on public.hari_libur
    for select using (true);

create policy "hari_libur: admin kelola penuh" on public.hari_libur
    for all using (app_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- TABEL: permintaan_data
-- Form permintaan/konsultasi data dari pengunjung publik, tanpa
-- login (pengganti Google Form).
-- ═══════════════════════════════════════════════════════════════
create table public.permintaan_data (
    id                bigint generated always as identity primary key,
    nama_lengkap      text not null,
    instansi          text not null,
    kegunaan_data     text not null check (kegunaan_data in ('kedinasan', 'pribadi')),
    email             text not null,
    no_hp             text not null,
    kebutuhan_data    text not null,
    status            text not null default 'baru' check (status in ('baru', 'diproses', 'selesai', 'dibatalkan')),
    tanggapan         text,
    ditangani_oleh    uuid references public.profiles(id),
    ditanggapi_pada   timestamptz,
    created_at        timestamptz not null default now()
);

create index idx_permintaan_data_status on public.permintaan_data(status);
create index idx_permintaan_data_created on public.permintaan_data(created_at desc);

alter table public.permintaan_data enable row level security;

-- Publik HANYA boleh INSERT — tidak boleh SELECT/UPDATE/DELETE, supaya
-- data pengunjung lain tidak bisa dibaca siapa pun lewat anon key.
create policy "permintaan_data: publik insert" on public.permintaan_data
    for insert with check (true);

create policy "permintaan_data: admin & petugas lihat" on public.permintaan_data
    for select using (app_role() in ('admin', 'petugas'));

create policy "permintaan_data: admin & petugas kelola" on public.permintaan_data
    for update using (app_role() in ('admin', 'petugas'));

create policy "permintaan_data: admin hapus" on public.permintaan_data
    for delete using (app_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- REALTIME: aktifkan untuk tabel antrian
-- Dipakai oleh DisplayBoard (app/display-antrian) agar update
-- status antrian tersiar otomatis ke semua layar tanpa polling/refresh.
-- ═══════════════════════════════════════════════════════════════
alter publication supabase_realtime add table public.antrian;

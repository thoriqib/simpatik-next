-- ═══════════════════════════════════════════════════════════════
-- FITUR BARU: Chat/Tanya-Jawab Permintaan Data via Link Unik
-- Jalankan file ini di Supabase SQL Editor.
--
-- Alur:
-- 1. Pengunjung isi form → dapat token unik (UUID, tidak bisa ditebak)
-- 2. Link "/permintaan-data/lacak/{token}" dikirim ke layar + email
-- 3. Setelah petugas "Tindak Lanjuti" (status='diproses'), pengunjung
--    bisa chat lewat link itu sampai petugas menandai "Selesai"
--
-- KEAMANAN PENTING: pengunjung TIDAK PERNAH diberi akses SELECT
-- langsung ke tabel permintaan_data/permintaan_data_pesan (kalau
-- diizinkan, siapa pun bisa membaca SEMUA data pengunjung lain lewat
-- anon key tanpa token sama sekali). Sebagai gantinya, akses publik
-- HANYA lewat function SECURITY DEFINER di bawah yang mewajibkan
-- token persis sebagai parameter — satu-satunya cara tahu token
-- adalah menerima link-nya.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Token unik untuk akses publik ────────────────────────────────
alter table public.permintaan_data
    add column if not exists token uuid not null default gen_random_uuid() unique;

-- ── Tabel pesan (chat) ────────────────────────────────────────────
create table if not exists public.permintaan_data_pesan (
    id                   bigint generated always as identity primary key,
    permintaan_data_id   bigint not null references public.permintaan_data(id) on delete cascade,
    pengirim             text not null check (pengirim in ('pengunjung', 'petugas')),
    petugas_id           uuid references public.profiles(id), -- null kalau dari pengunjung
    pesan                text not null,
    created_at           timestamptz not null default now()
);

create index if not exists idx_pesan_permintaan_data on public.permintaan_data_pesan(permintaan_data_id, created_at);

alter table public.permintaan_data_pesan enable row level security;

-- Admin & petugas boleh baca/kirim lewat panel biasa (client dengan sesi login)
create policy "pesan: admin & petugas lihat" on public.permintaan_data_pesan
    for select using (app_role() in ('admin', 'petugas'));
create policy "pesan: admin & petugas kirim" on public.permintaan_data_pesan
    for insert with check (app_role() in ('admin', 'petugas'));

-- TIDAK ADA policy untuk anon di tabel permintaan_data_pesan maupun
-- permintaan_data sama sekali — akses publik cuma lewat function di
-- bawah, bukan lewat SELECT/INSERT langsung ke tabel.

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: ambil detail + seluruh pesan by token (untuk halaman lacak)
-- ═══════════════════════════════════════════════════════════════
create or replace function public.get_permintaan_data_publik(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_permintaan record;
    v_pesan jsonb;
begin
    select pd.id, pd.nama_lengkap, pd.instansi, pd.kegunaan_data, pd.kebutuhan_data,
           pd.status, pd.created_at, pd.ditanggapi_pada, pr.name as petugas_nama
    into v_permintaan
    from public.permintaan_data pd
    left join public.profiles pr on pr.id = pd.ditangani_oleh
    where pd.token = p_token;

    if v_permintaan.id is null then
        return jsonb_build_object('error', 'not_found');
    end if;

    select coalesce(jsonb_agg(
        jsonb_build_object(
            'id', pp.id,
            'pengirim', pp.pengirim,
            'pesan', pp.pesan,
            'created_at', pp.created_at,
            'petugas_nama', prof.name
        ) order by pp.created_at
    ), '[]'::jsonb)
    into v_pesan
    from public.permintaan_data_pesan pp
    left join public.profiles prof on prof.id = pp.petugas_id
    where pp.permintaan_data_id = v_permintaan.id;

    return jsonb_build_object(
        'id', v_permintaan.id,
        'nama_lengkap', v_permintaan.nama_lengkap,
        'instansi', v_permintaan.instansi,
        'kegunaan_data', v_permintaan.kegunaan_data,
        'kebutuhan_data', v_permintaan.kebutuhan_data,
        'status', v_permintaan.status,
        'created_at', v_permintaan.created_at,
        'ditanggapi_pada', v_permintaan.ditanggapi_pada,
        'petugas_nama', v_permintaan.petugas_nama,
        'pesan', v_pesan
    );
end;
$$;

grant execute on function public.get_permintaan_data_publik(uuid) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: kirim pesan dari pengunjung (via token)
-- ═══════════════════════════════════════════════════════════════
create or replace function public.kirim_pesan_pengunjung(p_token uuid, p_pesan text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id bigint;
    v_status text;
    v_pesan_bersih text;
begin
    select id, status into v_id, v_status from public.permintaan_data where token = p_token;

    if v_id is null then
        return jsonb_build_object('error', 'Permintaan tidak ditemukan.');
    end if;
    if v_status <> 'diproses' then
        return jsonb_build_object('error', 'Percakapan belum aktif atau sudah ditutup.');
    end if;

    v_pesan_bersih := trim(p_pesan);
    if v_pesan_bersih is null or length(v_pesan_bersih) = 0 then
        return jsonb_build_object('error', 'Pesan tidak boleh kosong.');
    end if;
    if length(v_pesan_bersih) > 2000 then
        return jsonb_build_object('error', 'Pesan maksimal 2000 karakter.');
    end if;

    insert into public.permintaan_data_pesan (permintaan_data_id, pengirim, pesan)
    values (v_id, 'pengunjung', v_pesan_bersih);

    return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.kirim_pesan_pengunjung(uuid, text) to anon, authenticated;

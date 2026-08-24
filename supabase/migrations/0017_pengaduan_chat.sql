-- ═══════════════════════════════════════════════════════════════
-- FITUR BARU: Live Chat untuk Pengaduan (tetap anonim, tanpa email)
-- Jalankan file ini di Supabase SQL Editor.
--
-- Pola akses SAMA PERSIS dengan permintaan data online: token acak
-- tak tertebak sebagai "kunci" akses, ditampilkan HANYA di layar
-- setelah kirim (TIDAK dikirim ke email — supaya pengadu tetap
-- sepenuhnya anonim, sesuai permintaan). Pengadu wajib menyimpan
-- link itu sendiri untuk melanjutkan percakapan.
-- ═══════════════════════════════════════════════════════════════

alter table public.pengaduan
    add column if not exists token uuid not null default gen_random_uuid() unique;

create table if not exists public.pengaduan_pesan (
    id              bigint generated always as identity primary key,
    pengaduan_id    bigint not null references public.pengaduan(id) on delete cascade,
    pengirim        text not null check (pengirim in ('pengadu', 'petugas')),
    petugas_id      uuid references public.profiles(id), -- NULL kalau dari pengadu
    pesan           text not null,
    created_at      timestamptz not null default now()
);

create index if not exists idx_pengaduan_pesan_pengaduan_id on public.pengaduan_pesan(pengaduan_id);

alter table public.pengaduan_pesan enable row level security;

-- Sama seperti pengaduan itu sendiri — admin-only untuk kelola (belum
-- dibuka ke petugas, konsisten dengan model akses pengaduan yang sudah ada).
-- TIDAK ADA policy anon — akses publik HANYA lewat 2 function SECURITY
-- DEFINER di bawah, yang mewajibkan token persis sebagai parameter.
create policy "pengaduan_pesan: admin kelola" on public.pengaduan_pesan
    for all using (app_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: ambil detail pengaduan + riwayat chat via token (publik,
-- tanpa login). Nama/identitas petugas TIDAK disertakan — sama prinsip
-- privasi seperti permintaan data (siapa yang menangani hanya
-- diketahui staf internal).
-- ═══════════════════════════════════════════════════════════════
create or replace function public.get_pengaduan_publik(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_pengaduan record;
    v_pesan jsonb;
begin
    select id, subjek, isi_pengaduan, status, created_at, ditanggapi_pada
    into v_pengaduan
    from public.pengaduan
    where token = p_token;

    if v_pengaduan.id is null then
        return jsonb_build_object('error', 'not_found');
    end if;

    select coalesce(jsonb_agg(
        jsonb_build_object(
            'id', pp.id,
            'pengirim', pp.pengirim,
            'pesan', pp.pesan,
            'created_at', pp.created_at
        ) order by pp.created_at
    ), '[]'::jsonb)
    into v_pesan
    from public.pengaduan_pesan pp
    where pp.pengaduan_id = v_pengaduan.id;

    return jsonb_build_object(
        'id', v_pengaduan.id,
        'subjek', v_pengaduan.subjek,
        'isi_pengaduan', v_pengaduan.isi_pengaduan,
        'status', v_pengaduan.status,
        'created_at', v_pengaduan.created_at,
        'ditanggapi_pada', v_pengaduan.ditanggapi_pada,
        'pesan', v_pesan
    );
end;
$$;

grant execute on function public.get_pengaduan_publik(uuid) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: kirim pesan dari pengadu via token (publik, tanpa login).
-- Ditolak kalau status bukan 'diproses', atau di luar jam pelayanan —
-- konsisten dengan aturan chat permintaan data.
-- ═══════════════════════════════════════════════════════════════
create or replace function public.kirim_pesan_pengadu(p_token uuid, p_pesan text)
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
    select id, status into v_id, v_status from public.pengaduan where token = p_token;

    if v_id is null then
        return jsonb_build_object('error', 'Pengaduan tidak ditemukan.');
    end if;
    if v_status <> 'diproses' then
        return jsonb_build_object('error', 'Percakapan belum aktif atau sudah ditutup.');
    end if;
    if not public.dalam_jam_pelayanan() then
        return jsonb_build_object('error', 'Percakapan hanya bisa diakses pada jam pelayanan. Silakan kirim pesan kembali saat jam pelayanan berlangsung.');
    end if;

    v_pesan_bersih := trim(p_pesan);
    if v_pesan_bersih is null or length(v_pesan_bersih) = 0 then
        return jsonb_build_object('error', 'Pesan tidak boleh kosong.');
    end if;
    if length(v_pesan_bersih) > 2000 then
        return jsonb_build_object('error', 'Pesan maksimal 2000 karakter.');
    end if;

    insert into public.pengaduan_pesan (pengaduan_id, pengirim, pesan)
    values (v_id, 'pengadu', v_pesan_bersih);

    return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.kirim_pesan_pengadu(uuid, text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- REALTIME: sisi staf via Postgres Changes (RLS admin-only sudah cukup),
-- sisi publik via Broadcast from Database (topik dari token, sama
-- prinsipnya dengan permintaan data — lihat migration 0014 & 0016).
-- ═══════════════════════════════════════════════════════════════
alter publication supabase_realtime add table public.pengaduan_pesan;

create or replace function public.broadcast_pesan_pengaduan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_token uuid;
begin
    select token into v_token from public.pengaduan where id = new.pengaduan_id;

    if v_token is not null then
        perform realtime.broadcast_changes(
            'pengaduan:' || v_token::text,
            tg_op,
            tg_op,
            tg_table_name,
            tg_table_schema,
            new,
            null
        );
    end if;

    return new;
end;
$$;

drop trigger if exists trg_broadcast_pesan_pengaduan on public.pengaduan_pesan;
create trigger trg_broadcast_pesan_pengaduan
    after insert on public.pengaduan_pesan
    for each row execute function public.broadcast_pesan_pengaduan();

create policy "pengaduan: dengar broadcast topik sendiri"
    on "realtime"."messages"
    for select
    to anon, authenticated
    using (topic like 'pengaduan:%');

-- ═══════════════════════════════════════════════════════════════
-- FITUR BARU: Chat Real-Time untuk Permintaan Data
-- Jalankan file ini di Supabase SQL Editor.
--
-- Dua mekanisme berbeda dipakai, disesuaikan dengan model keamanan
-- yang sudah ada:
--
-- 1. SISI STAF (admin/petugas) → Postgres Changes biasa.
--    Mereka sudah py akses lewat RLS normal (app_role() in admin,petugas)
--    di tabel permintaan_data_pesan, jadi tinggal aktifkan publikasi.
--
-- 2. SISI PUBLIK (pengunjung, akses via token) → Broadcast from Database.
--    Publik TIDAK PERNAH punya akses SELECT langsung ke tabel manapun
--    (prinsip yang sudah dibangun sejak migration 0010) — jadi tidak
--    bisa pakai Postgres Changes biasa (itu tunduk pada RLS tabel asli).
--    Solusinya: trigger di database menyiarkan pesan baru ke topik
--    bernama dari TOKEN itu sendiri (mis. "permintaan-data:uuid-xxx").
--    Token yang tidak bisa ditebak itulah yang jadi "kunci" — sama
--    persis prinsipnya dengan akses lewat link unik yang sudah ada.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Postgres Changes untuk sisi staf ──────────────────────────
alter publication supabase_realtime add table public.permintaan_data_pesan;

-- ── 2. Broadcast from Database untuk sisi publik ─────────────────
create or replace function public.broadcast_pesan_permintaan_data()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_token uuid;
begin
    select token into v_token from public.permintaan_data where id = new.permintaan_data_id;

    if v_token is not null then
        perform realtime.broadcast_changes(
            'permintaan-data:' || v_token::text,  -- topic: token jadi "kunci rahasia"
            tg_op,                                  -- event
            tg_op,                                  -- operation
            tg_table_name,                          -- table
            tg_table_schema,                        -- schema
            new,                                     -- record baru
            null                                     -- tidak ada record lama (INSERT saja)
        );
    end if;

    return new;
end;
$$;

drop trigger if exists trg_broadcast_pesan_permintaan_data on public.permintaan_data_pesan;
create trigger trg_broadcast_pesan_permintaan_data
    after insert on public.permintaan_data_pesan
    for each row execute function public.broadcast_pesan_permintaan_data();

-- ── 3. Izin dengar siaran — dibatasi HANYA ke topik "permintaan-data:%" ──
-- Siapa pun (anon maupun staf) boleh MENDENGARKAN broadcast di topik ini,
-- TAPI supaya bisa dengar, mereka wajib tahu persis nama topiknya lebih
-- dulu (yang berisi token acak tak tertebak) — bukan berarti siapa saja
-- bisa lihat SEMUA percakapan. Prinsip sama seperti link unik: tahu
-- token = akses, tidak tahu = tidak bisa apa-apa.
create policy "permintaan_data: dengar broadcast topik sendiri"
    on "realtime"."messages"
    for select
    to anon, authenticated
    using (topic like 'permintaan-data:%');

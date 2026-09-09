-- ═══════════════════════════════════════════════════════════════
-- FIX AKAR MASALAH SESUNGGUHNYA: Gagal Kirim Pengaduan & Permintaan Data
-- Jalankan file ini di Supabase SQL Editor.
--
-- Setelah diagnosis panjang (RLS policy sudah benar 100%, direset
-- total, dites di tabel baru sesederhana mungkin — SEMUA tetap gagal
-- dengan error 42501), akhirnya ditemukan akar masalah SESUNGGUHNYA:
--
-- Kode aplikasi melakukan `INSERT ... RETURNING token` (lewat
-- `.insert({...}).select('token')` di Supabase JS client). Postgres
-- perlu membaca kembali baris yang baru di-insert untuk memenuhi
-- RETURNING itu — dan itu artinya perlu izin SELECT juga, bukan cuma
-- INSERT. Tabel `pengaduan` & `permintaan_data` SENGAJA tidak punya
-- policy SELECT untuk publik (demi anonimitas/privasi — publik cuma
-- boleh baca lewat function token-gated seperti get_pengaduan_publik).
-- Karena SELECT-nya tidak ada, RETURNING gagal, dan Postgres
-- melaporkannya sebagai "row violates row-level security policy" di
-- INSERT — padahal INSERT-nya sendiri sebenarnya sah. Ini perilaku
-- Postgres/PostgREST yang memang didokumentasikan tapi jarang
-- diketahui (bahkan dikonfirmasi di dokumentasi resmi Supabase untuk
-- kasus serupa di Storage API).
--
-- FIX: pindahkan proses insert ke function SECURITY DEFINER (bypass
-- RLS sepenuhnya, konsisten dengan pola ambil_nomor_antrian yang sudah
-- lebih dulu memakai pendekatan ini) — cuma kembalikan token, TIDAK
-- membuka akses SELECT publik ke seluruh tabel (anonimitas/privasi
-- tetap terjaga).
-- ═══════════════════════════════════════════════════════════════

create or replace function public.kirim_pengaduan_publik(p_subjek text, p_isi_pengaduan text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_token uuid;
begin
    insert into public.pengaduan (subjek, isi_pengaduan)
    values (p_subjek, p_isi_pengaduan)
    returning token into v_token;

    return v_token;
end;
$$;

grant execute on function public.kirim_pengaduan_publik(text, text) to anon, authenticated;

create or replace function public.kirim_permintaan_data_publik(
    p_nama_lengkap text,
    p_instansi text,
    p_kegunaan_data text,
    p_email text,
    p_no_hp text,
    p_kebutuhan_data text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_token uuid;
begin
    insert into public.permintaan_data (nama_lengkap, instansi, kegunaan_data, email, no_hp, kebutuhan_data)
    values (p_nama_lengkap, p_instansi, p_kegunaan_data, p_email, p_no_hp, p_kebutuhan_data)
    returning token into v_token;

    return v_token;
end;
$$;

grant execute on function public.kirim_permintaan_data_publik(text, text, text, text, text, text) to anon, authenticated;

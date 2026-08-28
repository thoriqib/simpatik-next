-- ═══════════════════════════════════════════════════════════════
-- UPDATE: Cari Ulang Link Lacak Permintaan Data — Email Saja
-- Jalankan file ini di Supabase SQL Editor.
--
-- Sebelumnya (migration 0018) butuh email + tanggal pengajuan.
-- Disederhanakan jadi email saja — lebih mudah diingat pengguna,
-- menampilkan SEMUA permintaan dengan email tersebut (dibatasi 50
-- terbaru sebagai jaga-jaga skala, bukan batasan praktis untuk
-- penggunaan wajar).
--
-- Signature function berubah (parameter berkurang), jadi function
-- lama dengan 2 parameter (text, date) harus di-drop dulu — Postgres
-- menganggap signature berbeda sebagai function terpisah (overload),
-- "create or replace" saja tidak cukup untuk mengganti signature.
-- ═══════════════════════════════════════════════════════════════

drop function if exists public.cari_permintaan_data_publik(text, date);

create or replace function public.cari_permintaan_data_publik(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_hasil jsonb;
begin
    select coalesce(jsonb_agg(
        jsonb_build_object(
            'token', pd.token,
            'kegunaan_data', pd.kegunaan_data,
            'kebutuhan_data', left(pd.kebutuhan_data, 120),
            'status', pd.status,
            'created_at', pd.created_at
        ) order by pd.created_at desc
    ), '[]'::jsonb)
    into v_hasil
    from (
        select * from public.permintaan_data
        where lower(email) = lower(trim(p_email))
        order by created_at desc
        limit 50
    ) pd;

    return v_hasil;
end;
$$;

grant execute on function public.cari_permintaan_data_publik(text) to anon, authenticated;

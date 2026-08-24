-- ═══════════════════════════════════════════════════════════════
-- FITUR BARU: Cari Ulang Link Lacak Permintaan Data (untuk pengguna
-- yang lupa menyimpan link lacak-nya)
-- Jalankan file ini di Supabase SQL Editor.
--
-- Permintaan data MEMILIKI email (beda dengan pengaduan yang anonim
-- total) — jadi bisa dicari ulang lewat kombinasi email + tanggal
-- pengajuan. Pengaduan TIDAK bisa punya fitur serupa karena memang
-- tidak menyimpan identitas apa pun; satu-satunya jalan pulih adalah
-- token/link itu sendiri (ditangani di frontend, tidak perlu function
-- database baru — cukup pakai get_pengaduan_publik yang sudah ada).
--
-- Data yang dikembalikan SENGAJA dibatasi minimal (token, ringkasan,
-- status, tanggal) — bukan seluruh isi permintaan — supaya hasil
-- pencarian ini cuma cukup untuk mengenali & mengarahkan ke halaman
-- lacak yang sebenarnya (yang jadi gerbang akses penuh lewat token).
-- ═══════════════════════════════════════════════════════════════

create or replace function public.cari_permintaan_data_publik(p_email text, p_tanggal date)
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
    from public.permintaan_data pd
    where lower(pd.email) = lower(trim(p_email))
      and (pd.created_at at time zone 'Asia/Jakarta')::date = p_tanggal;

    return v_hasil;
end;
$$;

grant execute on function public.cari_permintaan_data_publik(text, date) to anon, authenticated;

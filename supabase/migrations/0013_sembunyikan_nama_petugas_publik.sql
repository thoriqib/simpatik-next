-- ═══════════════════════════════════════════════════════════════
-- UPDATE: Sembunyikan Nama Petugas dari Pengunjung
-- Jalankan file ini di Supabase SQL Editor.
--
-- Sebelumnya function get_permintaan_data_publik() mengembalikan nama
-- petugas yang menangani (petugas_nama), ditampilkan di halaman lacak
-- publik sebagai "Ditangani oleh: [nama]". Ini diubah supaya siapa yang
-- menangani hanya diketahui staf internal (admin/petugas), bukan
-- pengunjung — dihapus di level FUNGSI DATABASE (bukan cuma disembunyikan
-- di tampilan), supaya datanya juga tidak terlihat lewat inspeksi
-- network request oleh pengunjung yang teknis.
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
    v_penilaian record;
begin
    select pd.id, pd.nama_lengkap, pd.instansi, pd.kegunaan_data, pd.kebutuhan_data,
           pd.status, pd.created_at, pd.ditanggapi_pada
    into v_permintaan
    from public.permintaan_data pd
    where pd.token = p_token;

    if v_permintaan.id is null then
        return jsonb_build_object('error', 'not_found');
    end if;

    -- [UPDATE] petugas_nama TIDAK LAGI disertakan per pesan — pengunjung
    -- cukup tahu itu balasan "dari petugas" (dibedakan lewat kolom
    -- `pengirim`), tanpa tahu siapa orangnya.
    select coalesce(jsonb_agg(
        jsonb_build_object(
            'id', pp.id,
            'pengirim', pp.pengirim,
            'pesan', pp.pesan,
            'created_at', pp.created_at
        ) order by pp.created_at
    ), '[]'::jsonb)
    into v_pesan
    from public.permintaan_data_pesan pp
    where pp.permintaan_data_id = v_permintaan.id;

    select nilai, komentar into v_penilaian from public.penilaian where permintaan_data_id = v_permintaan.id;

    return jsonb_build_object(
        'id', v_permintaan.id,
        'nama_lengkap', v_permintaan.nama_lengkap,
        'instansi', v_permintaan.instansi,
        'kegunaan_data', v_permintaan.kegunaan_data,
        'kebutuhan_data', v_permintaan.kebutuhan_data,
        'status', v_permintaan.status,
        'created_at', v_permintaan.created_at,
        'ditanggapi_pada', v_permintaan.ditanggapi_pada,
        'pesan', v_pesan,
        'sudah_dinilai', v_penilaian.nilai is not null,
        'nilai_diberikan', v_penilaian.nilai,
        'komentar_diberikan', v_penilaian.komentar
    );
end;
$$;

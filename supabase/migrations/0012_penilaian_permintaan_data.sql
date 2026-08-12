-- ═══════════════════════════════════════════════════════════════
-- FITUR BARU: Penilaian untuk Layanan Permintaan Data Online
-- Jalankan file ini di Supabase SQL Editor.
--
-- Tabel `penilaian` sebelumnya cuma untuk antrian tatap muka
-- (antrian_id wajib). Sekarang bisa juga untuk permintaan data online
-- (permintaan_data_id) — tepat SATU dari keduanya yang terisi per baris,
-- divalidasi lewat constraint di bawah.
-- ═══════════════════════════════════════════════════════════════

alter table public.penilaian alter column antrian_id drop not null;

alter table public.penilaian
    add column if not exists permintaan_data_id bigint references public.permintaan_data(id) on delete cascade;

alter table public.penilaian
    add constraint penilaian_permintaan_data_id_key unique (permintaan_data_id);

alter table public.penilaian
    add constraint penilaian_satu_sumber check (
        (antrian_id is not null and permintaan_data_id is null) or
        (antrian_id is null and permintaan_data_id is not null)
    );

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: kirim penilaian dari pengunjung untuk permintaan data
-- online, via token (SECURITY DEFINER — sama pola amannya dengan
-- kirim_pesan_pengunjung di migration 0010).
-- ═══════════════════════════════════════════════════════════════
create or replace function public.kirim_penilaian_permintaan_data(p_token uuid, p_nilai smallint, p_komentar text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id bigint;
    v_status text;
    v_ditangani_oleh uuid;
    v_sudah_ada bigint;
begin
    select id, status, ditangani_oleh into v_id, v_status, v_ditangani_oleh
    from public.permintaan_data where token = p_token;

    if v_id is null then
        return jsonb_build_object('error', 'Permintaan tidak ditemukan.');
    end if;
    if v_status <> 'selesai' then
        return jsonb_build_object('error', 'Penilaian hanya bisa diberikan setelah permintaan selesai ditangani.');
    end if;
    if v_ditangani_oleh is null then
        return jsonb_build_object('error', 'Belum ada petugas yang menangani permintaan ini.');
    end if;
    if p_nilai is null or p_nilai < 1 or p_nilai > 5 then
        return jsonb_build_object('error', 'Nilai wajib dipilih (1-5).');
    end if;

    select id into v_sudah_ada from public.penilaian where permintaan_data_id = v_id;
    if v_sudah_ada is not null then
        return jsonb_build_object('error', 'Permintaan ini sudah pernah dinilai.');
    end if;

    insert into public.penilaian (permintaan_data_id, petugas_id, nilai, komentar)
    values (v_id, v_ditangani_oleh, p_nilai, nullif(trim(p_komentar), ''));

    return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.kirim_penilaian_permintaan_data(uuid, smallint, text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- UPDATE: get_permintaan_data_publik sekarang juga mengembalikan status
-- penilaian, supaya halaman lacak tahu harus tampilkan form penilaian
-- atau ucapan terima kasih.
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
        'petugas_nama', v_permintaan.petugas_nama,
        'pesan', v_pesan,
        'sudah_dinilai', v_penilaian.nilai is not null,
        'nilai_diberikan', v_penilaian.nilai,
        'komentar_diberikan', v_penilaian.komentar
    );
end;
$$;

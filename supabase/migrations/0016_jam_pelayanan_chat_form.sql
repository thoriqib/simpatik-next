-- ═══════════════════════════════════════════════════════════════
-- FITUR BARU: Batasi Chat & Form Permintaan Data ke Jam Pelayanan
-- Jalankan file ini di Supabase SQL Editor.
--
-- Jam pelayanan diturunkan dari shift_piket yang aktif (bukan
-- di-hardcode) — konsisten dengan pendekatan yang sudah dipakai di
-- halaman /antrian.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.dalam_jam_pelayanan()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_jam_sekarang time;
    v_mulai time;
    v_selesai time;
begin
    v_jam_sekarang := (now() at time zone 'Asia/Jakarta')::time;

    select min(jam_mulai), max(jam_selesai) into v_mulai, v_selesai
    from public.shift_piket where is_aktif = true;

    -- Tidak ada shift aktif terdefinisi — jangan blokir (failsafe, supaya
    -- konfigurasi shift yang belum lengkap tidak mengunci total fitur ini).
    if v_mulai is null or v_selesai is null then
        return true;
    end if;

    return v_jam_sekarang >= v_mulai and v_jam_sekarang < v_selesai;
end;
$$;

grant execute on function public.dalam_jam_pelayanan() to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- UPDATE: kirim_pesan_pengunjung sekarang juga menolak kalau di luar
-- jam pelayanan, selain validasi status yang sudah ada sebelumnya.
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

    insert into public.permintaan_data_pesan (permintaan_data_id, pengirim, pesan)
    values (v_id, 'pengunjung', v_pesan_bersih);

    return jsonb_build_object('success', true);
end;
$$;

-- ═══════════════════════════════════════════════════════════════
-- UPDATE: Chat/Lacak Permintaan Data Sekarang 24 Jam
-- Jalankan file ini di Supabase SQL Editor.
--
-- Sebelumnya (migration 0016) percakapan permintaan data dibatasi jam
-- pelayanan, sama seperti form pengajuannya. Sekarang dipisah:
-- - Form pengajuan AWAL tetap dibatasi jam pelayanan (tidak berubah,
--   tidak masalah kalau ditutup di luar jam kerja)
-- - Percakapan/lacak yang SUDAH berjalan dibuka 24 jam — begitu chat
--   aktif, pengunjung tidak perlu "terkunci" menunggu jam kerja lagi
--   cuma untuk baca/kirim balasan.
--
-- Pengaduan TIDAK terdampak migration ini — kirim_pesan_pengadu (chat
-- pengaduan) tetap fungsi terpisah, tidak disentuh di sini.
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

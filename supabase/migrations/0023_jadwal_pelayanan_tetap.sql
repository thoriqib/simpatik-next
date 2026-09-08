-- ═══════════════════════════════════════════════════════════════
-- UPDATE: Jadwal Pelayanan Resmi Tetap (bukan lagi dari shift_piket)
-- Jalankan file ini di Supabase SQL Editor.
--
-- Jadwal resmi BPS Kota Jambi:
-- - Senin–Kamis: 08.00–15.30 WIB
-- - Jumat: 08.00–16.00 WIB
-- - Sabtu–Minggu: tidak ada pelayanan
--
-- Sebelumnya (migration 0016) fungsi ini menurunkan jam pelayanan dari
-- data shift_piket (satu rentang seragam untuk semua hari) — tidak bisa
-- merepresentasikan jadwal resmi yang beda per hari + libur akhir pekan
-- total. Sekarang jadwal ditulis tetap langsung di function ini, sinkron
-- dengan versi TypeScript di lib/jam-pelayanan.ts &
-- lib/jam-pelayanan-client.ts (kalau jadwal resmi berubah, ketiganya
-- wajib diubah bersamaan).
--
-- Dipakai oleh: kirim_pesan_pengadu (chat pengaduan). TIDAK lagi dipakai
-- chat permintaan data (sudah dibuka 24 jam sejak migration 0022).
-- ═══════════════════════════════════════════════════════════════

create or replace function public.dalam_jam_pelayanan()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_waktu_wib timestamp;
    v_hari integer; -- 0=Minggu, 1=Senin, ..., 6=Sabtu (extract(dow from ...))
    v_jam_menit time;
    v_mulai time;
    v_selesai time;
begin
    v_waktu_wib := now() at time zone 'Asia/Jakarta';
    v_hari := extract(dow from v_waktu_wib);
    v_jam_menit := v_waktu_wib::time;

    if v_hari = 0 or v_hari = 6 then
        return false; -- Minggu, Sabtu: tidak ada pelayanan
    elsif v_hari = 5 then
        v_mulai := '08:00'; v_selesai := '16:00'; -- Jumat
    else
        v_mulai := '08:00'; v_selesai := '15:30'; -- Senin–Kamis
    end if;

    return v_jam_menit >= v_mulai and v_jam_menit < v_selesai;
end;
$$;

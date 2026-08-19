import { createClient } from './supabase/server';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Ambil jam pelayanan resmi, diturunkan dari shift piket yang aktif
 * (bukan di-hardcode) — supaya kalau admin ubah jam shift, batas jam
 * pelayanan di seluruh fitur (antrian, form permintaan data, chat)
 * otomatis ikut menyesuaikan tanpa perlu ubah kode.
 *
 * Dipakai bersama oleh: halaman /antrian (JamPelayananGate), form
 * /permintaan-data, dan validasi server-side untuk chat.
 */
export async function ambilJamPelayanan(): Promise<{ jamMulai: string; jamSelesai: string }> {
    const supabase = await createClient();
    const { data: shiftAktif } = await supabase
        .from('shift_piket')
        .select('jam_mulai, jam_selesai')
        .eq('is_aktif', true)
        .order('jam_mulai');

    const jamMulai = shiftAktif && shiftAktif.length > 0 ? shiftAktif[0].jam_mulai.slice(0, 5) : '08:00';
    const jamSelesaiList = (shiftAktif ?? []).map((s) => s.jam_selesai.slice(0, 5)).sort();
    const jamSelesai = jamSelesaiList.length > 0 ? jamSelesaiList[jamSelesaiList.length - 1] : '15:30';

    return { jamMulai, jamSelesai };
}

/** Cek apakah waktu saat ini (WIB) berada dalam rentang jam pelayanan yang diberikan. */
export function dalamJamPelayananSekarang(jamMulai: string, jamSelesai: string): boolean {
    const jamSekarang = formatInTimeZone(new Date(), 'Asia/Jakarta', 'HH:mm');
    return jamSekarang >= jamMulai && jamSekarang < jamSelesai;
}

/**
 * Gabungan ambil + cek sekaligus — dipakai di Server Action yang perlu
 * validasi jam pelayanan sebelum memproses permintaan (form permintaan
 * data, kirim pesan chat staf).
 */
export async function cekDalamJamPelayanan(): Promise<{ dalamJam: boolean; jamMulai: string; jamSelesai: string }> {
    const { jamMulai, jamSelesai } = await ambilJamPelayanan();
    return { dalamJam: dalamJamPelayananSekarang(jamMulai, jamSelesai), jamMulai, jamSelesai };
}

import { formatInTimeZone } from 'date-fns-tz';

export interface JadwalHari {
    buka: boolean;
    jamMulai: string;
    jamSelesai: string;
}

/**
 * Jadwal pelayanan RESMI BPS Kota Jambi — tetap, berbeda per hari
 * (sebelumnya diturunkan otomatis dari data shift_piket, yang cuma bisa
 * menghasilkan satu rentang jam seragam untuk semua hari — tidak bisa
 * merepresentasikan jadwal resmi yang memang berbeda per hari + libur
 * akhir pekan total).
 *
 * Kunci: 0=Minggu, 1=Senin, ..., 6=Sabtu (konvensi JS Date.getDay()
 * dan Postgres extract(dow from ...), supaya sinkron dengan versi SQL
 * di migration 0023_jadwal_pelayanan_tetap.sql).
 */
export const JADWAL_PELAYANAN_MINGGUAN: Record<number, JadwalHari> = {
    0: { buka: false, jamMulai: '', jamSelesai: '' }, // Minggu
    1: { buka: true, jamMulai: '08:00', jamSelesai: '15:30' }, // Senin
    2: { buka: true, jamMulai: '08:00', jamSelesai: '15:30' }, // Selasa
    3: { buka: true, jamMulai: '08:00', jamSelesai: '15:30' }, // Rabu
    4: { buka: true, jamMulai: '08:00', jamSelesai: '15:30' }, // Kamis
    5: { buka: true, jamMulai: '08:00', jamSelesai: '16:00' }, // Jumat
    6: { buka: false, jamMulai: '', jamSelesai: '' }, // Sabtu
};

function hariIniWIB(): number {
    const label = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'short' }).format(new Date());
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[label] ?? 1;
}

/** Jadwal pelayanan untuk HARI INI (WIB) — sudah termasuk status buka/tutup. */
export function jadwalPelayananHariIni(): JadwalHari {
    return JADWAL_PELAYANAN_MINGGUAN[hariIniWIB()];
}

/**
 * Ambil jam pelayanan hari ini. Dipertahankan namanya & bentuk kembaliannya
 * (dipakai banyak tempat) meski sekarang tidak lagi query database sama
 * sekali — jadwal resmi sudah tetap, bukan lagi diturunkan dari shift.
 * Kalau hari ini libur (Sabtu/Minggu), tetap kembalikan jam Senin sebagai
 * fallback wajar untuk teks tampilan ("jam pelayanan kami: 08.00–15.30").
 */
export async function ambilJamPelayanan(): Promise<{ jamMulai: string; jamSelesai: string }> {
    const jadwal = jadwalPelayananHariIni();
    if (jadwal.buka) return { jamMulai: jadwal.jamMulai, jamSelesai: jadwal.jamSelesai };
    return { jamMulai: '08:00', jamSelesai: '15:30' };
}

/**
 * Cek apakah SEKARANG (WIB) berada dalam jam pelayanan. Parameter
 * jamMulai/jamSelesai dipertahankan demi kompatibilitas pemanggil yang
 * sudah ada (banyak tempat memanggil dengan hasil dari ambilJamPelayanan()
 * di atas) — TAPI tidak lagi dipakai untuk perhitungan; fungsi ini
 * sepenuhnya menghitung sendiri dari jadwal resmi tetap, termasuk
 * otomatis menutup total di akhir pekan.
 */
export function dalamJamPelayananSekarang(_jamMulai?: string, _jamSelesai?: string): boolean {
    const jadwal = jadwalPelayananHariIni();
    if (!jadwal.buka) return false;
    const jamSekarang = formatInTimeZone(new Date(), 'Asia/Jakarta', 'HH:mm');
    return jamSekarang >= jadwal.jamMulai && jamSekarang < jadwal.jamSelesai;
}

/**
 * Gabungan ambil + cek sekaligus — dipakai di Server Action yang perlu
 * validasi jam pelayanan sebelum memproses permintaan (form permintaan
 * data).
 */
export async function cekDalamJamPelayanan(): Promise<{ dalamJam: boolean; jamMulai: string; jamSelesai: string }> {
    const { jamMulai, jamSelesai } = await ambilJamPelayanan();
    return { dalamJam: dalamJamPelayananSekarang(), jamMulai, jamSelesai };
}

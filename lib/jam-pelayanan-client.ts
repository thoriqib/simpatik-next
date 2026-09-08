/**
 * Versi client-side dari pengecekan jam pelayanan — dipakai komponen
 * chat (ChatThreadPengaduan, ChatPengadu) untuk menampilkan status
 * "buka/tutup" yang berjalan real-time (dicek ulang tiap beberapa detik),
 * dan JamPelayananGate (halaman antrian) untuk gerbang akses. Fungsi
 * murni, tidak menyimpan state.
 *
 * Jadwal resmi SAMA PERSIS dengan versi server (lib/jam-pelayanan.ts)
 * — kalau jadwal resmi berubah, kedua file ini wajib diubah bersamaan.
 */
export interface JadwalHariClient {
    buka: boolean;
    jamMulai: string;
    jamSelesai: string;
}

const JADWAL_MINGGUAN_CLIENT: Record<number, JadwalHariClient> = {
    0: { buka: false, jamMulai: '', jamSelesai: '' }, // Minggu
    1: { buka: true, jamMulai: '08:00', jamSelesai: '15:30' }, // Senin
    2: { buka: true, jamMulai: '08:00', jamSelesai: '15:30' }, // Selasa
    3: { buka: true, jamMulai: '08:00', jamSelesai: '15:30' }, // Rabu
    4: { buka: true, jamMulai: '08:00', jamSelesai: '15:30' }, // Kamis
    5: { buka: true, jamMulai: '08:00', jamSelesai: '16:00' }, // Jumat
    6: { buka: false, jamMulai: '', jamSelesai: '' }, // Sabtu
};

export function ambilWaktuWIBSekarang(): { jam: number; menit: number; hari: number; label: string } {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(now);
    const jam = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const menit = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);

    const namaHari = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'short' }).format(now);
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const hari = map[namaHari] ?? 1;

    const label = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

    return { jam, menit, hari, label };
}

/** Jadwal pelayanan untuk HARI INI (WIB), dihitung di browser. */
export function jadwalPelayananHariIniClient(): JadwalHariClient {
    const { hari } = ambilWaktuWIBSekarang();
    return JADWAL_MINGGUAN_CLIENT[hari];
}

/**
 * Cek apakah sekarang dalam jam pelayanan. Parameter dipertahankan demi
 * kompatibilitas pemanggil (ChatThreadPengaduan, ChatPengadu menerima
 * jamMulai/jamSelesai lewat props dari server) — tapi tidak lagi dipakai
 * untuk perhitungan; fungsi ini menghitung sendiri dari jadwal resmi
 * tetap, termasuk otomatis menutup total di akhir pekan.
 */
export function cekDalamJamPelayananClient(_jamMulai?: string, _jamSelesai?: string): boolean {
    const { jam, menit } = ambilWaktuWIBSekarang();
    const jadwal = jadwalPelayananHariIniClient();
    if (!jadwal.buka) return false;

    const totalMenit = jam * 60 + menit;
    const [mulaiH, mulaiM] = jadwal.jamMulai.split(':').map(Number);
    const [selesaiH, selesaiM] = jadwal.jamSelesai.split(':').map(Number);
    const mulaiMenit = mulaiH * 60 + mulaiM;
    const selesaiMenit = selesaiH * 60 + selesaiM;

    return totalMenit >= mulaiMenit && totalMenit < selesaiMenit;
}

/**
 * Versi client-side dari pengecekan jam pelayanan — dipakai komponen
 * chat (ChatThread, ChatPengunjung) untuk menampilkan status "buka/tutup"
 * yang berjalan real-time (dicek ulang tiap beberapa detik), tanpa perlu
 * memanggil server berulang kali. Fungsi murni, tidak menyimpan state.
 */
export function ambilWaktuWIBSekarang(): { jam: number; menit: number } {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(now);
    const jam = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const menit = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return { jam, menit };
}

export function cekDalamJamPelayananClient(jamMulai: string, jamSelesai: string): boolean {
    const { jam, menit } = ambilWaktuWIBSekarang();
    const totalMenit = jam * 60 + menit;

    const [mulaiH, mulaiM] = jamMulai.split(':').map(Number);
    const [selesaiH, selesaiM] = jamSelesai.split(':').map(Number);
    const mulaiMenit = mulaiH * 60 + mulaiM;
    const selesaiMenit = selesaiH * 60 + selesaiM;

    return totalMenit >= mulaiMenit && totalMenit < selesaiMenit;
}

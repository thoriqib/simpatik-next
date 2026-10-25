/**
 * Fungsi murni (tanpa jaringan) — dipisah supaya mudah dites.
 */

/** "YYYY-MM-DD" untuk waktu sekarang di WIB, tanpa bergantung zona waktu server. */
export function tanggalWib(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** 0=Minggu ... 6=Sabtu untuk string "YYYY-MM-DD" (murni aritmatika, bebas zona waktu). */
export function hariDalamPekan(tanggal) {
    const [y, m, d] = tanggal.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function tanggalPanjang(tanggal) {
    const [y, m, d] = tanggal.split('-').map(Number);
    return `${HARI[hariDalamPekan(tanggal)]}, ${d} ${BULAN[m - 1]} ${y}`;
}

/** "Thoriq Ibadurrohman, S.Tr.Stat." → "Thoriq Ibadurrohman" (buang gelar setelah koma). */
export function namaTanpaGelar(nama) {
    return String(nama ?? '').split(',')[0].trim();
}

/** "08:00:00" → "08.00" */
export function jamPendek(jam) {
    return String(jam ?? '').slice(0, 5).replace(':', '.');
}

/**
 * Susun teks pengingat untuk satu petugas. `shifts` = [{ nama_shift, jam_mulai, jam_selesai }]
 * (urut jam mulai) — biasanya satu, tapi mendukung lebih dari satu shift di hari yang sama.
 */
export function susunPesan({ nama, tanggal, shifts }) {
    const daftar = shifts
        .map((s) => `• Shift ${s.nama_shift} (${jamPendek(s.jam_mulai)}–${jamPendek(s.jam_selesai)} WIB)`)
        .join('\n');
    return [
        `Selamat pagi, ${namaTanpaGelar(nama)} 👋`,
        '',
        `Pengingat piket Simpatik — hari ini, ${tanggalPanjang(tanggal)}, Anda terjadwal:`,
        daftar,
        '',
        'Jangan lupa presensi masuk ya. Terima kasih 🙏',
        '',
        '_Pesan otomatis dari Simpatik BPS Kota Jambi._',
    ].join('\n');
}

/** Nomor 62xxxxxxxxxx → JID WhatsApp. Mengembalikan null kalau formatnya tidak valid. */
export function keJid(nomor) {
    const n = String(nomor ?? '').replace(/\D/g, '');
    return /^628\d{8,11}$/.test(n) ? `${n}@s.whatsapp.net` : null;
}

export function acakDetik(min, max) {
    return Math.round((min + Math.random() * Math.max(0, max - min)) * 1000);
}

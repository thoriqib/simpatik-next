/**
 * Normalisasi nomor WhatsApp Indonesia ke format internasional tanpa "+"
 * (62xxxxxxxxxx) — format yang dipakai layanan pengirim di wa-reminder/.
 * File biasa (bukan 'use server') supaya bisa dipakai di server & client.
 *
 *   "0812-3456-7890"  → "6281234567890"
 *   "+62 812 3456 7890" → "6281234567890"
 *   "81234567890"     → "6281234567890"
 *   ""                → null   (artinya: hapus nomor)
 *   "abc" / terlalu pendek → undefined (tidak valid)
 */
export function normalisasiNomorWa(input: string): string | null | undefined {
    if (!input.trim()) return null;
    const digit = input.replace(/\D/g, '');
    if (!digit) return undefined;

    let nomor = digit;
    if (nomor.startsWith('62')) { /* sudah internasional */ }
    else if (nomor.startsWith('0')) nomor = '62' + nomor.slice(1);
    else if (nomor.startsWith('8')) nomor = '62' + nomor;
    else return undefined;

    // Nomor seluler Indonesia: 62 + 8xx + 7–11 digit → total 10–14 digit
    if (!/^628\d{8,11}$/.test(nomor)) return undefined;
    return nomor;
}

/** Tampilan ramah: 6281234567890 → 0812 3456 7890 */
export function tampilNomorWa(nomor: string | null | undefined): string {
    if (!nomor) return '';
    const lokal = '0' + nomor.slice(2);
    return lokal.replace(/^(\d{4})(\d{4})(\d+)$/, '$1 $2 $3');
}

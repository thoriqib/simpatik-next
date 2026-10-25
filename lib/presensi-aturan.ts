/**
 * Aturan presensi yang dipakai BERSAMA oleh presensi petugas
 * (presensiMasuk) dan koreksi manual admin (editPresensiAdmin), supaya
 * kedua jalur selalu menghasilkan angka yang sama.
 *
 * File ini sengaja BUKAN 'use server' — file 'use server' hanya boleh
 * mengekspor fungsi async, sedangkan ini konstanta + fungsi biasa.
 */

/** Toleransi keterlambatan presensi masuk (menit) dari jam mulai shift. */
export const TOLERANSI_TERLAMBAT_MENIT = 10;

/**
 * Hitung menit keterlambatan yang DICATAT, dari selisih menit antara
 * jam presensi masuk dan jam mulai shift.
 *
 *  - selisih <= 10 menit  → 0 (masih dalam toleransi, tidak terlambat)
 *  - selisih  > 10 menit  → terlambat; yang dicatat adalah SELURUH
 *                           selisih dari jam mulai shift (bukan hanya
 *                           kelebihan di atas toleransi).
 *    Contoh: shift 08.00, absen 08.10 → 0 ; absen 08.11 → 11 menit ;
 *            absen 08.25 → 25 menit.
 */
export function hitungTerlambatMenit(selisihMenitDariJamMulai: number): number {
    if (selisihMenitDariJamMulai <= TOLERANSI_TERLAMBAT_MENIT) return 0;
    return selisihMenitDariJamMulai;
}

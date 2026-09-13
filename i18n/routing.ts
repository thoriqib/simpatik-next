import { defineRouting } from 'next-intl/routing';

/**
 * Konfigurasi locale untuk halaman PUBLIK saja (landing, antrian,
 * permintaan-data, pengaduan, penilaian, faq, pesta-koja) — sesuai
 * kesepakatan, area admin/petugas TIDAK ikut diterjemahkan.
 *
 * localePrefix: 'as-needed' — Bahasa Indonesia (default) TETAP tanpa
 * prefix (/antrian, bukan /id/antrian), supaya semua link/URL yang
 * sudah pernah dibagikan (poster, flyer, QR code, dsb) tetap berfungsi
 * persis seperti sebelumnya. Bahasa Inggris dapat prefix /en/... saja.
 */
export const routing = defineRouting({
    locales: ['id', 'en'],
    defaultLocale: 'id',
    localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

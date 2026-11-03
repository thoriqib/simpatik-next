'use client';

import { usePathname } from '@/i18n/navigation';

/**
 * Kerangka halaman publik. Halaman biasa (form, FAQ, dll.) tetap berupa kartu tengah selebar
 * max-w-3xl di layar lebar. Halaman "lebar" (Pesta Koja — isinya grid kartu) memakai lebar
 * penuh (max-w-6xl) supaya sisi kiri-kanan tidak kosong; header & footer ikut dilebarkan
 * lewat atribut data-lebar (aturannya di globals.css).
 * usePathname dari i18n/navigation sudah membuang prefix locale (/en).
 */
const HALAMAN_LEBAR = ['/pesta-koja'];

export function PublicShell({
    header, footer, skipLabel, children,
}: {
    header: React.ReactNode;
    footer: React.ReactNode;
    skipLabel: string;
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const lebar = HALAMAN_LEBAR.includes(pathname);

    return (
        <div className="min-h-screen flex flex-col bg-paper-50 lg:bg-paper-100" {...(lebar ? { 'data-lebar': '' } : {})}>
            {/* Aksesibilitas: pengguna keyboard/pembaca layar bisa melompati header (muncul saat Tab ditekan) */}
            <a
                href="#konten-utama"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-navy-700 focus:text-white focus:px-4 focus:py-2.5 focus:rounded-lg focus:text-sm focus:font-semibold"
            >
                {skipLabel}
            </a>
            {header}
            <main id="konten-utama" tabIndex={-1} className="flex-1 w-full px-5 py-8 lg:py-12 focus:outline-none">
                <div
                    className={
                        lebar
                            ? 'max-w-2xl mx-auto lg:max-w-6xl lg:bg-white lg:rounded-3xl lg:border lg:border-paper-200 lg:shadow-card lg:p-12'
                            : 'max-w-2xl mx-auto lg:max-w-3xl lg:bg-white lg:rounded-3xl lg:border lg:border-paper-200 lg:shadow-card lg:p-12'
                    }
                >
                    {children}
                </div>
            </main>
            {footer}
        </div>
    );
}

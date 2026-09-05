import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import { AccessibilityWidget } from '@/components/AccessibilityWidget';
import './globals.css';

// Plus Jakarta Sans — display & UI: geometris, punya karakter, dan namanya
// sendiri beresonansi dengan konteks aplikasi (BPS, instansi pemerintah Indonesia).
const jakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-jakarta',
    display: 'swap',
});

// IBM Plex Mono — khusus untuk data numerik: kode antrian, jam, angka tabel,
// statistik. Pilihan fungsional, bukan dekoratif: di aplikasi statistik,
// angka yang sejajar rapi membantu keterbacaan saat dibandingkan.
const plexMono = IBM_Plex_Mono({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--font-plex-mono',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Simpatik — Sistem Informasi Pelayanan Statistik',
    description: 'Sistem Informasi Pelayanan Statistik — BPS Kota Jambi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id" className={`${jakarta.variable} ${plexMono.variable}`} suppressHydrationWarning>
            {/*
              suppressHydrationWarning di <body> meredam warning hydration
              mismatch yang disebabkan ekstensi browser (crypto wallet,
              Grammarly, Dark Reader, dll) yang menyuntik atribut ke DOM
              sebelum React sempat render. Mismatch di komponen anak tetap
              tertangkap normal.
            */}
            <body className="bg-paper-50 text-navy-950 font-sans antialiased" suppressHydrationWarning>
                {children}
                <AccessibilityWidget />
            </body>
        </html>
    );
}

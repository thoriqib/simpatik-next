import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Simpatik — Sistem Informasi Pelayanan Statistik',
    description: 'Sistem Informasi Pelayanan Statistik — BPS Kota Jambi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id">
            <body className="bg-gray-100 font-sans antialiased">{children}</body>
        </html>
    );
}

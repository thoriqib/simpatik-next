'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Home, MessageSquareWarning, FileSearch, Link2, HelpCircle } from 'lucide-react';

// [UPDATE] Menu "Antrian" DAN "Jadwal Petugas" sengaja TIDAK ditampilkan
// di navigasi publik. Antrian: halaman /antrian tetap ada & bisa diakses
// langsung (untuk kios/tablet di ruang pelayanan), tapi tidak dipromosikan
// di sini — mencegah pengambilan nomor dari luar kantor. Jadwal Petugas:
// sekarang cuma bisa diakses lewat tombol di dashboard petugas/admin
// (bukan konsumsi publik lagi, dan sudah dipindah ke luar scope terjemahan).
const NAV = [
    { href: '/', key: 'home', icon: Home },
    { href: '/permintaan-data', key: 'permintaanData', icon: FileSearch },
    { href: '/pesta-koja', key: 'pestaKoja', icon: Link2 },
    { href: '/pengaduan', key: 'pengaduan', icon: MessageSquareWarning },
    { href: '/faq', key: 'faq', icon: HelpCircle },
] as const;

export function PublicHeader() {
    const pathname = usePathname();
    const t = useTranslations('nav');

    return (
        <header className="bg-navy-950 text-white">
            <div className="max-w-2xl mx-auto px-5 py-5 flex items-center justify-between gap-3">
                <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo/logo-bps.webp" alt="Logo BPS" className="w-9 h-auto shrink-0" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo/logo-pst-full.svg" alt="Pelayanan Statistik Terpadu — Badan Pusat Statistik" className="h-8 w-auto" />
                </Link>
                <LanguageSwitcher />
            </div>
            <nav className="max-w-2xl mx-auto px-5 flex gap-1 border-t border-white/10 overflow-x-auto">
                {NAV.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-1.5 text-sm px-3 py-3 border-b-2 transition-colors whitespace-nowrap shrink-0
                                ${active ? 'border-amber-500 text-white font-medium' : 'border-transparent text-white/50 hover:text-white'}`}
                        >
                            <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                            {t(item.key)}
                        </Link>
                    );
                })}
            </nav>
        </header>
    );
}

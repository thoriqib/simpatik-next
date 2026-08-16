'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, MessageSquareWarning, FileSearch, Link2 } from 'lucide-react';

// [UPDATE] Menu "Antrian" sengaja TIDAK ditampilkan di navigasi publik —
// halaman /antrian tetap ada & bisa diakses langsung (untuk kios/tablet
// yang memang ditempatkan di ruang pelayanan BPS Kota Jambi), tapi tidak
// dipromosikan di sini. Ini mencegah pengunjung mengambil nomor antrian
// dari luar kantor sebelum benar-benar datang ke lokasi pelayanan.
const NAV = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/jadwal-petugas', label: 'Jadwal Petugas', icon: CalendarDays },
    { href: '/permintaan-data', label: 'Permintaan Data', icon: FileSearch },
    { href: '/pesta-koja', label: 'Pesta Koja', icon: Link2 },
    { href: '/pengaduan', label: 'Pengaduan', icon: MessageSquareWarning },
];

export function PublicHeader() {
    const pathname = usePathname();

    return (
        <header className="bg-navy-950 text-white">
            <Link href="/" className="block hover:opacity-90 transition-opacity">
                <div className="max-w-2xl mx-auto px-5 py-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-azure-500 to-navy-700 flex items-center justify-center font-bold shrink-0">
                        S
                    </div>
                    <div>
                        <div className="font-bold text-lg leading-tight tracking-tight">Simpatik</div>
                        <div className="text-white/50 text-xs">Sistem Informasi Pelayanan Statistik · BPS Kota Jambi</div>
                    </div>
                </div>
            </Link>
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
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </header>
    );
}

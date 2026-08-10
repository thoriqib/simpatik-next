'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, CalendarDays, MessageSquareWarning, FileSearch } from 'lucide-react';

const NAV = [
    { href: '/', label: 'Antrian', icon: Ticket },
    { href: '/jadwal-petugas', label: 'Jadwal Petugas', icon: CalendarDays },
    { href: '/permintaan-data', label: 'Permintaan Data', icon: FileSearch },
    { href: '/pengaduan', label: 'Pengaduan', icon: MessageSquareWarning },
];

export function PublicHeader() {
    const pathname = usePathname();

    return (
        <header className="bg-navy-950 text-white">
            <div className="max-w-2xl mx-auto px-5 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-azure-500 to-navy-700 flex items-center justify-center font-bold shrink-0">
                    S
                </div>
                <div>
                    <div className="font-bold text-lg leading-tight tracking-tight">Simpatik</div>
                    <div className="text-white/50 text-xs">Sistem Informasi Pelayanan Statistik · BPS Kota Jambi</div>
                </div>
            </div>
            <nav className="max-w-2xl mx-auto px-5 flex gap-1 border-t border-white/10">
                {NAV.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-1.5 text-sm px-3 py-3 border-b-2 transition-colors
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

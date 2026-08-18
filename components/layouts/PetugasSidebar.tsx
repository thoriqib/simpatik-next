'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/actions/auth';
import { LayoutDashboard, CalendarDays, Clock, LogOut, X, FileSearch, Users } from 'lucide-react';

const MENU = [
    { href: '/petugas/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/petugas/jadwal', label: 'Jadwal Saya', icon: CalendarDays },
    { href: '/jadwal-petugas', label: 'Jadwal Semua Petugas', icon: Users },
    { href: '/petugas/presensi', label: 'Presensi', icon: Clock },
    { href: '/petugas/permintaan-data', label: 'Permintaan Data', icon: FileSearch },
];

export function PetugasSidebar({ name, mobileOpen, onClose }: { name: string; mobileOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();

    return (
        <>
            {mobileOpen && <div className="fixed inset-0 bg-navy-950/50 z-40 lg:hidden" onClick={onClose} />}

            <aside className={`fixed top-0 left-0 h-full w-64 bg-navy-950 text-white flex flex-col z-50
                transition-transform duration-200 ease-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

                <div className="flex items-center justify-between px-6 py-6">
                    <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo/logo-bps.webp" alt="Logo BPS" className="w-7 h-auto shrink-0" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo/logo-pst-icon.svg" alt="Logo PST" className="w-7 h-7 shrink-0" />
                        <div>
                            <div className="font-bold text-sm leading-tight tracking-tight">Simpatik</div>
                            <div className="text-xs text-white/40">BPS Kota Jambi</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-white/50 hover:text-white p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
                    {MENU.map((item) => {
                        const active = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors relative
                                    ${active ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                            >
                                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-500 rounded-r-full" />}
                                <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-3 py-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-2 mb-1">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-navy-950 font-bold text-sm shrink-0">
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{name}</div>
                            <div className="text-xs text-white/40">Petugas Pelayanan</div>
                        </div>
                    </div>
                    <form action={logout}>
                        <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm text-white/60 hover:text-white">
                            <LogOut className="w-4 h-4" strokeWidth={2} />
                            Keluar
                        </button>
                    </form>
                </div>
            </aside>
        </>
    );
}

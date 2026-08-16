'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/actions/auth';
import {
    LayoutDashboard, Users, Clock, CalendarDays, Tag,
    MessageSquareWarning, Star, ClipboardList, LogOut, X, Trophy, FileSearch, BarChart3, ShieldCheck, Link2,
} from 'lucide-react';

const MENU: { group: string | null; href: string; label: string; icon: React.ElementType }[] = [
    { group: null, href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { group: 'Petugas', href: '/admin/petugas', label: 'Data Petugas', icon: Users },
    { group: 'Petugas', href: '/admin/shift', label: 'Pengaturan Shift', icon: Clock },
    { group: 'Petugas', href: '/admin/jadwal', label: 'Jadwal Piket', icon: CalendarDays },
    { group: 'Petugas', href: '/admin/pengaturan-akses', label: 'Pengaturan Akses', icon: ShieldCheck },
    { group: 'Layanan', href: '/admin/jenis-layanan', label: 'Jenis Layanan', icon: Tag },
    { group: 'Layanan', href: '/admin/permintaan-data', label: 'Permintaan Data', icon: FileSearch },
    { group: 'Layanan', href: '/admin/pengaduan', label: 'Pengaduan', icon: MessageSquareWarning },
    { group: 'Layanan', href: '/admin/pesta-koja', label: 'Pesta Koja', icon: Link2 },
    { group: 'Penilaian', href: '/admin/penilaian', label: 'Semua Penilaian', icon: Star },
    { group: 'Penilaian', href: '/admin/petugas-terbaik', label: 'Petugas Terbaik', icon: Trophy },
    { group: 'Laporan', href: '/admin/laporan/antrian', label: 'Lap. Antrian', icon: ClipboardList },
    { group: 'Laporan', href: '/admin/laporan/layanan', label: 'Rekap Layanan', icon: BarChart3 },
    { group: 'Laporan', href: '/admin/laporan/penilaian', label: 'Lap. Penilaian', icon: ClipboardList },
    { group: 'Laporan', href: '/admin/laporan/presensi', label: 'Lap. Presensi', icon: ClipboardList },
];

export function AdminSidebar({ name, mobileOpen, onClose }: { name: string; mobileOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();
    let lastGroup: string | null = null;

    return (
        <>
            {mobileOpen && (
                <div className="fixed inset-0 bg-navy-950/50 z-40 lg:hidden" onClick={onClose} />
            )}

            <aside className={`fixed top-0 left-0 h-full w-64 bg-navy-950 text-white flex flex-col z-50
                transition-transform duration-200 ease-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

                <div className="flex items-center justify-between px-6 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-azure-500 to-navy-700 flex items-center justify-center font-bold text-sm shrink-0">S</div>
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
                        const showGroupLabel = item.group !== lastGroup;
                        lastGroup = item.group;
                        // [FIX] pathname.startsWith(item.href) saja bisa salah cocok — misal
                        // "/admin/petugas-terbaik".startsWith("/admin/petugas") = true padahal
                        // itu 2 halaman berbeda. Wajib cek batas path (diikuti "/" atau persis sama).
                        const active = pathname === item.href
                            || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href + '/'));
                        const Icon = item.icon;
                        return (
                            <div key={item.href}>
                                {showGroupLabel && item.group && (
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold px-3 pt-5 pb-2">{item.group}</p>
                                )}
                                <Link
                                    href={item.href}
                                    onClick={onClose}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors relative
                                        ${active ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                                >
                                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-500 rounded-r-full" />}
                                    <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                                    {item.label}
                                </Link>
                            </div>
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
                            <div className="text-xs text-white/40">Administrator</div>
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

import Link from 'next/link';
import { logout } from '@/lib/actions/auth';

const MENU = [
    { href: '/petugas/dashboard', label: 'Dashboard' },
    { href: '/petugas/jadwal', label: 'Jadwal Saya' },
    { href: '/petugas/presensi', label: 'Presensi' },
];

export function PetugasSidebar({ name }: { name: string }) {
    return (
        <aside className="fixed top-0 left-0 h-full w-64 bg-[#003580] text-white flex flex-col z-30">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-blue-700">
                <div>
                    <div className="font-bold text-sm leading-tight">Simpatik</div>
                    <div className="text-xs text-blue-200">BPS Kota Jambi</div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {MENU.map((item) => (
                    <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="px-4 py-4 border-t border-blue-700">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center text-blue-900 font-bold text-sm">
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{name}</div>
                        <div className="text-xs text-blue-300">Petugas Pelayanan</div>
                    </div>
                </div>
                <form action={logout} className="mt-1">
                    <button type="submit" className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm text-blue-200">
                        Keluar
                    </button>
                </form>
            </div>
        </aside>
    );
}

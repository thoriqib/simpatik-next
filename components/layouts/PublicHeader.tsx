import Link from 'next/link';

export function PublicHeader() {
    return (
        <header className="bg-[#003580] text-white shadow">
            <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
                <div>
                    <div className="font-bold text-lg leading-tight">Simpatik</div>
                    <div className="text-blue-200 text-sm">Sistem Informasi Pelayanan Statistik</div>
                    <div className="text-blue-300 text-xs">BPS Kota Jambi</div>
                </div>
            </div>
            <nav className="max-w-2xl mx-auto px-4 py-2 flex gap-4 text-sm border-t border-blue-700">
                <Link href="/" className="text-blue-200 hover:text-white transition">🎫 Antrian</Link>
                <Link href="/jadwal-petugas" className="text-blue-200 hover:text-white transition">📅 Jadwal Petugas</Link>
                <Link href="/pengaduan" className="text-blue-200 hover:text-white transition">📢 Pengaduan</Link>
            </nav>
        </header>
    );
}

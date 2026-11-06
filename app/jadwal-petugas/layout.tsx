import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Kerangka halaman /jadwal-petugas. Rute ini berada di luar [locale] dan di luar
 * layout admin/petugas, jadi sebelumnya kontennya menempel ke tepi layar tanpa
 * margin/padding. Layout ini memberi header ringkas + wadah berlebar maksimum.
 * (Admin & petugas memakai JadwalPetugasView di dalam shell masing-masing, tidak lewat sini.)
 */
export default function JadwalPetugasLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-paper-50">
            <header className="bg-navy-950 text-white">
                <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo/logo-bps.webp" alt="Logo BPS" className="w-9 h-auto shrink-0" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo/logo-pst-full.svg" alt="Pelayanan Statistik Terpadu — Badan Pusat Statistik" className="h-8 w-auto" />
                    </div>
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors shrink-0">
                        <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Beranda</span>
                    </Link>
                </div>
            </header>
            <main className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
                {children}
            </main>
        </div>
    );
}

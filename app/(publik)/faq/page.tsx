import { FaqAccordion } from './FaqAccordion';
import Link from 'next/link';
import { HelpCircle, MessageSquareWarning } from 'lucide-react';

export default function FaqPage() {
    return (
        <>
            <div className="text-center mb-7">
                <div className="w-14 h-14 rounded-2xl bg-azure-500/10 text-azure-500 flex items-center justify-center mx-auto mb-3">
                    <HelpCircle className="w-7 h-7" />
                </div>
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">Pertanyaan yang Sering Diajukan</h1>
                <p className="text-sm text-navy-950/50 mt-1">
                    Belum ketemu jawabannya? Sampaikan lewat menu Pengaduan.
                </p>
            </div>

            <FaqAccordion />

            <div className="mt-8 bg-navy-950 text-white rounded-2xl p-5 text-center">
                <MessageSquareWarning className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                <p className="text-sm font-medium mb-1">Masih Ada Pertanyaan Lain?</p>
                <p className="text-xs text-white/50 mb-4">Sampaikan lewat pengaduan (anonim) atau ajukan konsultasi langsung ke petugas kami.</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Link href="/pengaduan" className="text-xs bg-white text-navy-950 px-4 py-2 rounded-lg font-semibold hover:bg-paper-100 transition-colors">
                        Kirim Pengaduan
                    </Link>
                    <Link href="/permintaan-data" className="text-xs bg-white/10 border border-white/20 px-4 py-2 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                        Konsultasi Data
                    </Link>
                </div>
            </div>
        </>
    );
}

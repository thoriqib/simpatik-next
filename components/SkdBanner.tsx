import { ClipboardList, ArrowUpRight } from 'lucide-react';

const SKD_URL = 'https://skd.bps.go.id/skd/s/1571';

/**
 * Himbauan mengisi Survei Kebutuhan Data (SKD) — dipakai di beberapa
 * titik perjalanan pengunjung: setelah ambil nomor antrian, setelah
 * dilayani (offline maupun online). Dirancang sebagai kartu terang
 * yang tetap kontras baik di atas latar gelap (halaman tiket) maupun
 * terang (halaman lain), supaya bisa dipakai ulang tanpa perlu varian.
 */
export function SkdBanner({ ringkas = false }: { ringkas?: boolean }) {
    return (
        <a
            href={SKD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-2xl px-4 py-3.5 hover:border-amber-300 hover:shadow-soft transition-all"
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy-950 text-sm leading-tight">Bantu Kami Lebih Baik Lagi</div>
                    {!ringkas && (
                        <div className="text-xs text-navy-950/50 mt-0.5 leading-snug">
                            Isi Survei Kebutuhan Data (SKD) — masukan Anda membantu BPS Kota Jambi merancang layanan statistik yang lebih sesuai kebutuhan masyarakat.
                        </div>
                    )}
                </div>
                <ArrowUpRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
            </div>
        </a>
    );
}

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatTanggal } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { todayDateStringWIB } from '@/lib/utils';
import Link from 'next/link';
import { RefreshCw, MonitorPlay, Star } from 'lucide-react';
import type { Antrian } from '@/lib/types/database';
import { PrintButton } from './PrintButton';
import { AutoPrint } from './AutoPrint';
import { Suspense } from 'react';
import { SkdBanner } from '@/components/SkdBanner';

export const dynamic = 'force-dynamic';

export default async function TiketPage({ params }: { params: Promise<{ kode: string }> }) {
    const { kode } = await params;
    const supabase = await createClient();

    // [FIX] Cast eksplisit — relasi to-one `jenis_layanan` ditebak sebagai
    // array tanpa generated types.
    const { data: antrianRaw } = await supabase
        .from('antrian')
        .select('*, jenis_layanan(*), penilaian(id)')
        .eq('kode_antrian', kode)
        .eq('tanggal', todayDateStringWIB())
        .single();

    const antrian = antrianRaw as unknown as Antrian | null;

    if (!antrian) notFound();

    const { count: menunggu } = await supabase
        .from('antrian')
        .select('*', { count: 'exact', head: true })
        .eq('jenis_layanan_id', antrian.jenis_layanan_id)
        .eq('tanggal', todayDateStringWIB())
        .eq('status', 'menunggu')
        .lt('nomor_urut', antrian.nomor_urut);

    const sudahDinilai = antrian.penilaian && antrian.penilaian.length > 0;

    return (
        <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 pb-28 -mx-5 -my-8 print:bg-white print:block print:min-h-0 print:p-0 print:-mx-0 print:-my-0">
            <Suspense fallback={null}>
                <AutoPrint />
            </Suspense>
            <div className="bg-white rounded-3xl shadow-card w-full max-w-xs overflow-hidden print:shadow-none print:rounded-none print:mx-auto">
                <div className="bg-navy-950 text-white px-6 py-5 text-center print:bg-white print:text-navy-950 print:border-b-2 print:border-navy-950">
                    <div className="font-bold text-sm tracking-tight">Simpatik</div>
                    <div className="text-white/40 text-xs mt-0.5 print:text-navy-950/60">Sistem Informasi Pelayanan Statistik</div>
                </div>

                {/* Signature: nomor antrian besar di atas tekstur kertas grafik */}
                <div className="relative px-6 py-8 text-center border-b border-dashed border-paper-200 bg-grid-dot">
                    <div className="text-[11px] text-navy-950/40 uppercase tracking-widest mb-2 font-medium">{antrian.jenis_layanan?.nama_layanan}</div>
                    <div className="font-mono text-7xl font-semibold text-navy-950 tracking-tight tabular">{antrian.kode_antrian}</div>
                    <div className="text-sm text-navy-950/70 mt-3 font-medium">{antrian.nama_pengunjung}</div>
                    <div className="text-xs text-navy-950/40 mt-0.5">{formatTanggal(antrian.tanggal)}</div>
                </div>

                <div className="px-6 py-5">
                    {antrian.status === 'menunggu' ? (
                        (menunggu ?? 0) > 0 ? (
                            <div className="bg-amber-500/10 rounded-xl px-4 py-3 text-center mb-3">
                                <div className="text-xs text-amber-600 font-medium">Antrian di depan Anda</div>
                                <div className="font-mono text-2xl font-semibold text-amber-600 tabular">{menunggu}</div>
                            </div>
                        ) : (
                            <div className="bg-emerald-500/10 rounded-xl px-4 py-3 text-center mb-3">
                                <div className="text-sm font-medium text-emerald-600">Anda berikutnya</div>
                            </div>
                        )
                    ) : (
                        <div className="flex justify-center mb-3"><Badge status={antrian.status} /></div>
                    )}
                    <p className="text-xs text-navy-950/40 text-center print:hidden">Harap menunggu hingga nomor Anda dipanggil</p>
                </div>
            </div>

            <div className="w-full max-w-xs mt-4 print:hidden">
                <SkdBanner ringkas />
            </div>

            <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-2.5 px-4 flex-wrap print:hidden">
                <PrintButton />
                <Link href={`/antrian/${kode}/tiket`}
                    className="inline-flex items-center gap-1.5 bg-white/10 text-white px-5 py-3 rounded-full font-medium hover:bg-white/15 transition-colors text-sm backdrop-blur-sm">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </Link>
                <Link href="/display-antrian"
                    className="inline-flex items-center gap-1.5 bg-white text-navy-950 px-5 py-3 rounded-full font-medium shadow-card hover:bg-paper-50 transition-colors text-sm">
                    <MonitorPlay className="w-3.5 h-3.5" />
                    Display
                </Link>
                {antrian.status === 'selesai' && !sudahDinilai && (
                    <Link href={`/penilaian/${kode}`}
                        className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-5 py-3 rounded-full font-semibold shadow-card hover:bg-amber-500/90 transition-colors text-sm">
                        <Star className="w-3.5 h-3.5" />
                        Beri Penilaian
                    </Link>
                )}
            </div>
        </div>
    );
}

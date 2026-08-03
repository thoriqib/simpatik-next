import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatTanggal } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { todayDateStringWIB } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TiketPage({ params }: { params: Promise<{ kode: string }> }) {
    const { kode } = await params;
    const supabase = await createClient();

    const { data: antrian } = await supabase
        .from('antrian')
        .select('*, jenis_layanan(*), penilaian(id)')
        .eq('kode_antrian', kode)
        .eq('tanggal', todayDateStringWIB())
        .single();

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
        <div className="min-h-screen flex flex-col items-center justify-center p-4 -mx-4 -my-6">
            <div className="bg-white rounded-2xl shadow-lg w-72 overflow-hidden">
                <div className="bg-[#003580] text-white px-6 py-4 text-center">
                    <div className="font-bold text-sm">Simpatik</div>
                    <div className="text-blue-200 text-xs">Sistem Informasi Pelayanan Statistik</div>
                </div>
                <div className="px-6 py-5 text-center border-b border-dashed border-gray-200">
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{antrian.jenis_layanan.nama_layanan}</div>
                    <div className="text-7xl font-black text-[#003580] tracking-tight my-2">{antrian.kode_antrian}</div>
                    <div className="text-sm text-gray-600">{antrian.nama_pengunjung}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatTanggal(antrian.tanggal)}</div>
                </div>
                <div className="px-6 py-4">
                    {antrian.status === 'menunggu' ? (
                        (menunggu ?? 0) > 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 text-center mb-3">
                                <div className="text-xs text-yellow-600">Antrian di depan Anda</div>
                                <div className="text-2xl font-bold text-yellow-700">{menunggu}</div>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-center mb-3">
                                <div className="text-sm font-medium text-green-700">✅ Anda berikutnya!</div>
                            </div>
                        )
                    ) : (
                        <div className="text-center mb-3"><Badge status={antrian.status} /></div>
                    )}
                    <p className="text-xs text-gray-400 text-center">Harap menunggu hingga nomor Anda dipanggil</p>
                </div>
            </div>

            <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-3 px-4 flex-wrap">
                <Link href={`/antrian/${kode}/tiket`}
                    className="bg-gray-100 text-gray-600 px-5 py-3 rounded-full font-medium shadow hover:bg-gray-200 transition border text-sm">
                    🔄 Refresh Status
                </Link>
                <Link href="/display-antrian"
                    className="bg-white text-gray-700 px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-gray-50 transition border text-sm">
                    📺 Display
                </Link>
                {antrian.status === 'selesai' && !sudahDinilai && (
                    <Link href={`/penilaian/${kode}`}
                        className="bg-yellow-400 text-yellow-900 px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-yellow-300 transition text-sm">
                        ⭐ Beri Penilaian
                    </Link>
                )}
            </div>
        </div>
    );
}

import { createClient } from '@/lib/supabase/server';
import { JenisKunjunganToggle } from './JenisKunjunganToggle';
import { JamPelayananGate } from './JamPelayananGate';
import Link from 'next/link';
import { MonitorPlay, MessageSquareWarning, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AntrianPage({
    searchParams,
}: {
    searchParams: Promise<{ mitra?: string }>;
}) {
    const params = await searchParams;

    // [FITUR BARU] Kunjungan Mitra Statistik berhasil dicatat — tampilan
    // konfirmasi sederhana, BUKAN halaman tiket (tidak ada nomor antrian
    // untuk kunjungan jenis ini).
    if (params.mitra === 'sukses') {
        return (
            <div className="text-center py-10">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-navy-950">Kunjungan Tercatat</h2>
                <p className="text-sm text-navy-950/50 mt-2 max-w-sm mx-auto">
                    Terima kasih, kunjungan Anda sebagai Mitra Statistik sudah tercatat.
                    Tidak perlu menunggu nomor antrian — silakan langsung menuju petugas terkait.
                </p>
                <Link href="/antrian" className="inline-block mt-6 text-sm text-azure-500 hover:text-navy-700 font-medium transition-colors">
                    ← Kembali ke Halaman Antrian
                </Link>
            </div>
        );
    }

    const supabase = await createClient();
    const { data: jenisLayanan } = await supabase
        .from('jenis_layanan')
        .select('*')
        .eq('is_aktif', true)
        .order('kode');

    return (
        <>
            <div className="mb-7">
                <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Ambil Nomor Antrian</h1>
                <p className="text-sm text-navy-950/50 mt-1">Isi data di bawah untuk mendapatkan nomor antrian pelayanan Anda</p>
            </div>

            <JamPelayananGate>
                <JenisKunjunganToggle jenisLayanan={jenisLayanan ?? []} />

                <div className="mt-6 flex justify-center gap-6 text-sm">
                    <Link href="/display-antrian" className="inline-flex items-center gap-1.5 text-azure-500 hover:text-navy-700 font-medium transition-colors">
                        <MonitorPlay className="w-4 h-4" />
                        Display Antrian
                    </Link>
                    <Link href="/pengaduan" className="inline-flex items-center gap-1.5 text-navy-950/50 hover:text-navy-950 transition-colors">
                        <MessageSquareWarning className="w-4 h-4" />
                        Kirim Pengaduan
                    </Link>
                </div>
            </JamPelayananGate>
        </>
    );
}

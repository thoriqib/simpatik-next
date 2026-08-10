import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { PermintaanDataForm } from './PermintaanDataForm';

export const dynamic = 'force-dynamic';

export default async function PermintaanDataPage({
    searchParams,
}: {
    searchParams: Promise<{ sukses?: string }>;
}) {
    const params = await searchParams;

    if (params.sukses === '1') {
        return (
            <div className="text-center py-10">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-navy-950">Permintaan Terkirim</h2>
                <p className="text-sm text-navy-950/50 mt-2 max-w-sm mx-auto">
                    Terima kasih. Permintaan/konsultasi data Anda sudah kami terima dan akan
                    segera ditindaklanjuti oleh petugas BPS Kota Jambi. Kami akan menghubungi
                    Anda lewat email atau nomor HP yang didaftarkan.
                </p>
                <Link href="/permintaan-data" className="inline-block mt-6 text-sm text-azure-500 hover:text-navy-700 font-medium transition-colors">
                    Kirim Permintaan Lain
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">Form Permintaan Data</h1>
                <p className="text-sm text-navy-950/50 mt-1">
                    Permintaan/Konsultasi Data Pelayanan Statistik Terpadu — BPS Kota Jambi.
                    Form ini terbuka untuk umum, tidak perlu login.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-paper-200 p-6 sm:p-7">
                <PermintaanDataForm />
            </div>
        </>
    );
}

import { CheckCircle2 } from 'lucide-react';
import { PermintaanDataForm } from './PermintaanDataForm';
import { LinkSuksesCard } from './LinkSuksesCard';

export const dynamic = 'force-dynamic';

export default async function PermintaanDataPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const params = await searchParams;

    if (params.token) {
        return (
            <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-navy-950">Permintaan Terkirim</h2>
                <p className="text-sm text-navy-950/50 mt-2 max-w-sm mx-auto">
                    Simpan link di bawah untuk memantau status & berkomunikasi langsung dengan
                    petugas. Link ini juga sudah dikirim ke email Anda.
                </p>

                <LinkSuksesCard token={params.token} />
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

import { PengaduanForm } from './PengaduanForm';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default async function PengaduanPage({
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
                <h2 className="text-xl font-bold text-navy-950">Pengaduan Terkirim</h2>
                <p className="text-sm text-navy-950/50 mt-2 max-w-sm mx-auto">
                    Terima kasih. Pengaduan Anda sudah kami terima dan akan segera ditindaklanjuti.
                    Karena bersifat anonim, kami tidak dapat menghubungi Anda langsung — namun masukan
                    Anda tetap menjadi perhatian kami.
                </p>
                <Link href="/pengaduan" className="inline-block mt-6 text-sm text-azure-500 hover:text-navy-700 font-medium transition-colors">
                    Kirim Pengaduan Lain
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-navy-950">Kirim Pengaduan</h2>
                <p className="text-sm text-navy-950/50 mt-1">Pengaduan bersifat anonim. Sampaikan keluhan atau masukan Anda dengan jujur.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-paper-200 p-6">
                <PengaduanForm />
            </div>

            <div className="mt-4 text-center">
                <Link href="/" className="text-sm text-navy-950/50 hover:underline">← Kembali ke Beranda</Link>
            </div>
        </>
    );
}

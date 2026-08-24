import { PengaduanForm } from './PengaduanForm';
import Link from 'next/link';
import { CheckCircle2, KeyRound, ArrowRight } from 'lucide-react';
import { LinkPengaduanCard } from './LinkPengaduanCard';

export default async function PengaduanPage({
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
                <h2 className="text-xl font-bold text-navy-950">Pengaduan Terkirim</h2>
                <p className="text-sm text-navy-950/50 mt-2 max-w-sm mx-auto">
                    Pengaduan Anda bersifat <strong>anonim</strong> — kami sengaja tidak meminta
                    email atau kontak apa pun. Simpan link di bawah baik-baik, itu satu-satunya
                    cara Anda bisa memantau & berkomunikasi dengan admin soal pengaduan ini.
                </p>

                <LinkPengaduanCard token={params.token} />
            </div>
        );
    }

    return (
        <>
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-navy-950">Kirim Pengaduan</h2>
                <p className="text-sm text-navy-950/50 mt-1">Pengaduan bersifat anonim. Sampaikan keluhan atau masukan Anda dengan jujur.</p>
            </div>

            <Link
                href="/pengaduan/cari"
                className="group flex items-center gap-3.5 bg-azure-500/10 border border-azure-500/25 rounded-2xl px-4 py-4 mb-5 hover:bg-azure-500/15 hover:border-azure-500/40 transition-colors"
            >
                <div className="w-11 h-11 rounded-xl bg-azure-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <KeyRound className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy-950 text-sm">Sudah melakukan pengaduan sebelumnya?</div>
                    <div className="text-xs text-navy-950/60 mt-0.5">Kehilangan link lacak? Masukkan link/token yang diberikan di sini</div>
                </div>
                <ArrowRight className="w-4 h-4 text-azure-500 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-paper-200 p-6">
                <PengaduanForm />
            </div>

            <div className="mt-4 text-center">
                <Link href="/" className="text-sm text-navy-950/50 hover:underline">← Kembali ke Beranda</Link>
            </div>
        </>
    );
}

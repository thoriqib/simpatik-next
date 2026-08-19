import { CheckCircle2, Clock, MoonStar, AlertTriangle } from 'lucide-react';
import { PermintaanDataForm } from './PermintaanDataForm';
import { LinkSuksesCard } from './LinkSuksesCard';
import { ambilJamPelayanan, dalamJamPelayananSekarang } from '@/lib/jam-pelayanan';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function PermintaanDataPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string; emailGagal?: string }>;
}) {
    noStore();
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
                    petugas.{params.emailGagal !== '1' && ' Link ini juga sudah dikirim ke email Anda.'}
                </p>

                {/* [FITUR BARU] Kalau pengiriman email gagal, tetap tampilkan link
                    (jalur utama), tapi beri tahu jujur bahwa email tidak terkirim
                    supaya pengunjung tahu harus menyimpan link ini sendiri. */}
                {params.emailGagal === '1' && (
                    <div className="mt-4 max-w-sm mx-auto bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 leading-relaxed">
                            Email berisi link ini <strong>gagal terkirim</strong>. Jangan khawatir — link Anda tetap aktif di bawah ini, tapi pastikan disimpan baik-baik karena tidak dikirim ke email.
                        </p>
                    </div>
                )}

                <LinkSuksesCard token={params.token} />
            </div>
        );
    }

    // [FITUR BARU] Form hanya dibuka pada jam pelayanan — jam pelayanan
    // diturunkan dari shift aktif (bukan di-hardcode), konsisten dengan
    // pendekatan yang sudah dipakai di halaman /antrian.
    const { jamMulai, jamSelesai } = await ambilJamPelayanan();
    const dalamJam = dalamJamPelayananSekarang(jamMulai, jamSelesai);

    if (!dalamJam) {
        return (
            <div className="bg-white rounded-2xl shadow-soft border border-paper-200 p-8 text-center">
                <div className="w-16 h-16 bg-navy-950/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MoonStar className="w-8 h-8 text-navy-950/40" />
                </div>
                <h2 className="text-lg font-bold text-navy-950 mb-2">Formulir Ditutup Sementara</h2>
                <p className="text-sm text-navy-950/50 max-w-sm mx-auto leading-relaxed">
                    Permintaan data/konsultasi hanya bisa diajukan pada jam pelayanan{' '}
                    <strong className="text-navy-950">{jamMulai}–{jamSelesai} WIB</strong>.
                    Silakan kembali pada jam tersebut.
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs text-navy-950/40 mt-4 bg-paper-50 px-3 py-1.5 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    Jam pelayanan: {jamMulai}–{jamSelesai} WIB
                </div>
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

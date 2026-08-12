import { notFound } from 'next/navigation';
import { ambilPermintaanDataPublik } from '@/lib/actions/permintaan-data';
import { Badge } from '@/components/ui/Badge';
import { ChatPengunjung } from './ChatPengunjung';
import { Clock, CheckCircle2, MessageCircleOff } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

const KEGUNAAN_LABEL: Record<string, string> = {
    kedinasan: 'Kedinasan/Pekerjaan',
    pribadi: 'Pribadi/Tugas Sekolah/Kuliah/Skripsi',
};

export default async function LacakPermintaanDataPage({ params }: { params: Promise<{ token: string }> }) {
    // [FIX BUG] Lihat catatan lengkap di app/petugas/dashboard/page.tsx —
    // halaman publik ini sepenuhnya bergantung pada tombol "Muat ulang"
    // untuk melihat balasan terbaru, jadi kalau ada cache basi, pengunjung
    // bisa terus-menerus tidak melihat balasan petugas walau sudah dikirim.
    noStore();

    const { token } = await params;
    const data = await ambilPermintaanDataPublik(token);

    if (!data) notFound();

    const statusInfo = {
        baru: { icon: Clock, text: 'Menunggu petugas menindaklanjuti permintaan Anda. Silakan cek kembali beberapa saat lagi.', color: 'text-amber-600 bg-amber-500/10' },
        diproses: { icon: MessageCircleOff, text: 'Permintaan Anda sedang ditangani. Anda bisa berkomunikasi langsung dengan petugas di bawah.', color: 'text-azure-500 bg-azure-500/10' },
        selesai: { icon: CheckCircle2, text: 'Permintaan Anda sudah selesai ditangani. Percakapan ditutup.', color: 'text-emerald-600 bg-emerald-500/10' },
        dibatalkan: { icon: Clock, text: 'Permintaan ini sedang diproses ulang oleh petugas.', color: 'text-amber-600 bg-amber-500/10' },
    }[data.status];

    return (
        <>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">Lacak Permintaan Data</h1>
                <p className="text-sm text-navy-950/50 mt-1">
                    Diajukan {new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-paper-200 p-6 mb-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <div className="text-xs text-navy-950/40 uppercase tracking-wide mb-1">Kegunaan Data</div>
                        <div className="text-sm font-medium text-navy-950">{KEGUNAAN_LABEL[data.kegunaan_data] ?? data.kegunaan_data}</div>
                    </div>
                    <Badge status={data.status} />
                </div>
                <div className="pt-4 border-t border-paper-200">
                    <div className="text-xs text-navy-950/40 uppercase tracking-wide mb-1.5">Permintaan Anda</div>
                    <p className="text-sm text-navy-950 leading-relaxed whitespace-pre-line">{data.kebutuhan_data}</p>
                </div>
                {data.petugas_nama && (
                    <p className="text-xs text-navy-950/50 mt-3 pt-3 border-t border-paper-200">
                        Ditangani oleh: <strong className="text-navy-950">{data.petugas_nama}</strong>
                    </p>
                )}
            </div>

            {statusInfo && (
                <div className={`rounded-xl px-4 py-3 text-sm mb-5 flex items-start gap-2.5 ${statusInfo.color}`}>
                    <statusInfo.icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{statusInfo.text}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-soft border border-paper-200 p-6">
                <h2 className="text-base font-semibold text-navy-950 mb-4">Percakapan</h2>
                <ChatPengunjung token={token} pesanAwal={data.pesan} aktif={data.status === 'diproses'} />
            </div>

            <p className="text-xs text-navy-950/40 text-center mt-5">
                Simpan link ini baik-baik. Siapa pun yang memiliki link ini bisa melihat & membalas percakapan.
            </p>
        </>
    );
}

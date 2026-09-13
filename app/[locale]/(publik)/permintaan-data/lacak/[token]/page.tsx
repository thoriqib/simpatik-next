import { notFound } from 'next/navigation';
import { ambilPermintaanDataPublik } from '@/lib/actions/permintaan-data';
import { Badge } from '@/components/ui/Badge';
import { ChatPengunjung } from './ChatPengunjung';
import { PenilaianPermintaanData } from './PenilaianPermintaanData';
import { SkdBanner } from '@/components/SkdBanner';
import { Clock, CheckCircle2, MessageCircleOff, Star } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function LacakPermintaanDataPage({ params }: { params: Promise<{ token: string; locale: string }> }) {
    // [FIX BUG] Lihat catatan lengkap di app/petugas/dashboard/page.tsx —
    // halaman publik ini sepenuhnya bergantung pada tombol "Muat ulang"
    // untuk melihat balasan terbaru, jadi kalau ada cache basi, pengunjung
    // bisa terus-menerus tidak melihat balasan petugas walau sudah dikirim.
    noStore();

    const { token, locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('permintaanData');
    const localeTanggal = locale === 'en' ? 'en-US' : 'id-ID';

    const data = await ambilPermintaanDataPublik(token);

    if (!data) notFound();

    const KEGUNAAN_LABEL: Record<string, string> = {
        kedinasan: t('form.kedinasan'),
        pribadi: t('form.pribadi'),
    };

    const statusInfo = {
        baru: { icon: Clock, text: t('lacak.status.baru'), color: 'text-amber-600 bg-amber-500/10' },
        diproses: { icon: MessageCircleOff, text: t('lacak.status.diproses'), color: 'text-azure-500 bg-azure-500/10' },
        selesai: { icon: CheckCircle2, text: t('lacak.status.selesai'), color: 'text-emerald-600 bg-emerald-500/10' },
        dibatalkan: { icon: Clock, text: t('lacak.status.dibatalkan'), color: 'text-amber-600 bg-amber-500/10' },
    }[data.status];

    return (
        <>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">{t('lacak.title')}</h1>
                <p className="text-sm text-navy-950/50 mt-1">
                    {t('lacak.submittedAt', { date: new Date(data.created_at).toLocaleDateString(localeTanggal, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) })}
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-paper-200 p-6 mb-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <div className="text-xs text-navy-950/40 uppercase tracking-wide mb-1">{t('lacak.kegunaanData')}</div>
                        <div className="text-sm font-medium text-navy-950">{KEGUNAAN_LABEL[data.kegunaan_data] ?? data.kegunaan_data}</div>
                    </div>
                    <Badge status={data.status} />
                </div>
                <div className="pt-4 border-t border-paper-200">
                    <div className="text-xs text-navy-950/40 uppercase tracking-wide mb-1.5">{t('lacak.yourRequest')}</div>
                    <p className="text-sm text-navy-950 leading-relaxed whitespace-pre-line">{data.kebutuhan_data}</p>
                </div>
            </div>

            {statusInfo && (
                <div className={`rounded-xl px-4 py-3 text-sm mb-5 flex items-start gap-2.5 ${statusInfo.color}`}>
                    <statusInfo.icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{statusInfo.text}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-soft border border-paper-200 p-6">
                <h2 className="text-base font-semibold text-navy-950 mb-4">{t('lacak.conversation')}</h2>
                <ChatPengunjung token={token} pesanAwal={data.pesan} aktif={data.status === 'diproses'} />
            </div>

            {data.status === 'selesai' && (
                <div className="bg-white rounded-2xl shadow-soft border border-paper-200 p-6 mt-5">
                    <h2 className="text-base font-semibold text-navy-950 mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        {t('lacak.ratingTitle')}
                    </h2>
                    <PenilaianPermintaanData
                        token={token}
                        sudahDinilai={data.sudah_dinilai}
                        nilaiDiberikan={data.nilai_diberikan}
                        komentarDiberikan={data.komentar_diberikan}
                    />
                </div>
            )}

            {data.status === 'selesai' && (
                <div className="mt-5">
                    <SkdBanner />
                </div>
            )}

            <p className="text-xs text-navy-950/40 text-center mt-5">
                {t('lacak.saveHint')}
            </p>
        </>
    );
}

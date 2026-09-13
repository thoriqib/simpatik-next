import { notFound } from 'next/navigation';
import { ambilPengaduanPublik } from '@/lib/actions/pengaduan';
import { PublicBadge as Badge } from '@/components/PublicBadge';
import { ChatPengadu } from './ChatPengadu';
import { ambilJamPelayanan } from '@/lib/jam-pelayanan';
import { Clock, MessageCircleOff, CheckCircle2 } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function LacakPengaduanPage({ params }: { params: Promise<{ token: string; locale: string }> }) {
    noStore();

    const { token, locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('pengaduan');
    const localeTanggal = locale === 'en' ? 'en-US' : 'id-ID';

    const data = await ambilPengaduanPublik(token);

    if (!data) notFound();

    const { jamMulai, jamSelesai } = await ambilJamPelayanan();

    const statusInfo = {
        baru: { icon: Clock, text: t('lacak.status.baru'), color: 'text-amber-600 bg-amber-500/10' },
        diproses: { icon: MessageCircleOff, text: t('lacak.status.diproses'), color: 'text-azure-500 bg-azure-500/10' },
        selesai: { icon: CheckCircle2, text: t('lacak.status.selesai'), color: 'text-emerald-600 bg-emerald-500/10' },
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
                    <div className="text-sm font-medium text-navy-950">{data.subjek}</div>
                    <Badge status={data.status} />
                </div>
                <div className="pt-4 border-t border-paper-200">
                    <div className="text-xs text-navy-950/40 uppercase tracking-wide mb-1.5">{t('lacak.yourComplaint')}</div>
                    <p className="text-sm text-navy-950 leading-relaxed whitespace-pre-line">{data.isi_pengaduan}</p>
                </div>
            </div>

            {statusInfo && (
                <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm mb-5 ${statusInfo.color}`}>
                    <statusInfo.icon className="w-4 h-4 shrink-0" />
                    {statusInfo.text}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-soft border border-paper-200 p-6">
                <h2 className="text-base font-semibold text-navy-950 mb-4">{t('lacak.conversation')}</h2>
                <ChatPengadu
                    token={token}
                    pesanAwal={data.pesan}
                    aktif={data.status === 'diproses'}
                    jamMulai={jamMulai}
                    jamSelesai={jamSelesai}
                />
            </div>

            <p className="text-xs text-navy-950/40 text-center mt-5">
                {t('lacak.saveHint')}
            </p>
        </>
    );
}

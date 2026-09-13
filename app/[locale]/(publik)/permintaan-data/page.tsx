import { Link } from '@/i18n/navigation';
import { CheckCircle2, Clock, MoonStar, Search, ArrowRight } from 'lucide-react';
import { PermintaanDataForm } from './PermintaanDataForm';
import { LinkSuksesCard } from './LinkSuksesCard';
import { ambilJamPelayanan, dalamJamPelayananSekarang } from '@/lib/jam-pelayanan';
import { unstable_noStore as noStore } from 'next/cache';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function PermintaanDataPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ token?: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('permintaanData');

    noStore();
    const sp = await searchParams;

    if (sp.token) {
        return (
            <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-navy-950">{t('success.title')}</h2>
                <p className="text-sm text-navy-950/50 mt-2 max-w-sm mx-auto">
                    {t('success.desc')}
                </p>

                <LinkSuksesCard token={sp.token} />
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
                <h2 className="text-lg font-bold text-navy-950 mb-2">{t('closed.title')}</h2>
                <p className="text-sm text-navy-950/50 max-w-sm mx-auto leading-relaxed">
                    {t('closed.desc', { jamMulai, jamSelesai })}
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs text-navy-950/40 mt-4 bg-paper-50 px-3 py-1.5 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    {t('closed.hours', { jamMulai, jamSelesai })}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">{t('page.title')}</h1>
                <p className="text-sm text-navy-950/50 mt-1">
                    {t('page.subtitle')}
                </p>
            </div>

            <Link
                href="/permintaan-data/cari"
                className="group flex items-center gap-3.5 bg-azure-500/10 border border-azure-500/25 rounded-2xl px-4 py-4 mb-5 hover:bg-azure-500/15 hover:border-azure-500/40 transition-colors"
            >
                <div className="w-11 h-11 rounded-xl bg-azure-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Search className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy-950 text-sm">{t('page.searchPrompt')}</div>
                    <div className="text-xs text-navy-950/60 mt-0.5">{t('page.searchHint')}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-azure-500 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>

            <div className="bg-white rounded-2xl shadow-soft border border-paper-200 p-6 sm:p-7">
                <PermintaanDataForm />
            </div>
        </>
    );
}

import { createClient } from '@/lib/supabase/server';
import { JenisKunjunganToggle } from './JenisKunjunganToggle';
import { JamPelayananGate } from './JamPelayananGate';
import { Link } from '@/i18n/navigation';
import NextLink from 'next/link';
import { MonitorPlay, MessageSquareWarning, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function AntrianPageRoute({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ mitra?: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const sp = await searchParams;
    return <AntrianPage mitraSukses={sp.mitra === 'sukses'} />;
}

function AntrianPage({ mitraSukses }: { mitraSukses: boolean }) {
    const t = useTranslations('antrian');

    // [FITUR BARU] Kunjungan Mitra Statistik berhasil dicatat — tampilan
    // konfirmasi sederhana, BUKAN halaman tiket (tidak ada nomor antrian
    // untuk kunjungan jenis ini).
    if (mitraSukses) {
        return (
            <div className="text-center py-10">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-navy-950">{t('mitraSuccess.title')}</h2>
                <p className="text-sm text-navy-950/50 mt-2 max-w-sm mx-auto">
                    {t('mitraSuccess.desc')}
                </p>
                <Link href="/antrian" className="inline-block mt-6 text-sm text-azure-500 hover:text-navy-700 font-medium transition-colors">
                    ← {t('mitraSuccess.back')}
                </Link>
            </div>
        );
    }

    return <AntrianForm />;
}

async function AntrianForm() {
    const t = useTranslations('antrian');
    const supabase = await createClient();
    const { data: jenisLayanan } = await supabase
        .from('jenis_layanan')
        .select('*')
        .eq('is_aktif', true)
        .order('kode');

    return (
        <>
            <div className="mb-7">
                <h1 className="text-2xl font-bold text-navy-950 tracking-tight">{t('title')}</h1>
                <p className="text-sm text-navy-950/50 mt-1">{t('subtitle')}</p>
            </div>

            <JamPelayananGate>
                <JenisKunjunganToggle jenisLayanan={jenisLayanan ?? []} />

                <div className="mt-6 flex justify-center gap-6 text-sm">
                    {/* [CATATAN] /display-antrian SENGAJA pakai next/link biasa
                        (bukan Link locale-aware) — halaman itu di luar scope
                        terjemahan (kios tampilan, tetap Indonesia saja),
                        jadi tidak boleh ikut ter-prefix /en. */}
                    <NextLink href="/display-antrian" className="inline-flex items-center gap-1.5 text-azure-500 hover:text-navy-700 font-medium transition-colors">
                        <MonitorPlay className="w-4 h-4" />
                        {t('displayAntrian')}
                    </NextLink>
                    <Link href="/pengaduan" className="inline-flex items-center gap-1.5 text-navy-950/50 hover:text-navy-950 transition-colors">
                        <MessageSquareWarning className="w-4 h-4" />
                        {t('sendComplaint')}
                    </Link>
                </div>
            </JamPelayananGate>
        </>
    );
}

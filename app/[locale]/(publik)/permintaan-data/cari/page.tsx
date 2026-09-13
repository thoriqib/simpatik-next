import { CariForm } from './CariForm';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

export default async function CariPermintaanDataPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <CariPageContent />;
}

function CariPageContent() {
    const t = useTranslations('permintaanData.cari');
    return (
        <>
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">{t('title')}</h1>
                <p className="text-sm text-navy-950/50 mt-1 max-w-sm mx-auto">
                    {t('subtitle')}
                </p>
            </div>

            <CariForm />

            <div className="mt-4 text-center">
                <Link href="/permintaan-data" className="text-sm text-navy-950/50 hover:underline">← {t('back')}</Link>
            </div>
        </>
    );
}

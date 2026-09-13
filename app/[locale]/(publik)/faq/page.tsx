import { FaqAccordion } from './FaqAccordion';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { HelpCircle, MessageSquareWarning } from 'lucide-react';

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <FaqPageContent />;
}

function FaqPageContent() {
    const t = useTranslations('faq');
    return (
        <>
            <div className="text-center mb-7">
                <div className="w-14 h-14 rounded-2xl bg-azure-500/10 text-azure-500 flex items-center justify-center mx-auto mb-3">
                    <HelpCircle className="w-7 h-7" />
                </div>
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">{t('title')}</h1>
                <p className="text-sm text-navy-950/50 mt-1">{t('subtitle')}</p>
            </div>

            <FaqAccordion />

            <div className="mt-8 bg-navy-950 text-white rounded-2xl p-5 text-center">
                <MessageSquareWarning className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                <p className="text-sm font-medium mb-1">{t('stillHaveQuestions')}</p>
                <p className="text-xs text-white/50 mb-4">{t('stillHaveQuestionsDesc')}</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Link href="/pengaduan" className="text-xs bg-white text-navy-950 px-4 py-2 rounded-lg font-semibold hover:bg-paper-100 transition-colors">
                        {t('sendComplaint')}
                    </Link>
                    <Link href="/permintaan-data" className="text-xs bg-white/10 border border-white/20 px-4 py-2 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                        {t('dataConsultation')}
                    </Link>
                </div>
            </div>
        </>
    );
}

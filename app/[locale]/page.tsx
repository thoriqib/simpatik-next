import { Link } from '@/i18n/navigation';
import { PublicFooter } from '@/components/layouts/PublicFooter';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import {
    MessageSquareWarning, FileSearch, Star, Ticket,
    ArrowRight, Building2, ShieldCheck, Clock3, Sparkles, MapPin, Phone, Link2,
} from 'lucide-react';

const FITUR_KEYS = [
    { key: 'antrian', icon: Ticket, warna: 'bg-navy-700/10 text-navy-700' },
    { key: 'permintaanData', icon: FileSearch, warna: 'bg-azure-500/10 text-azure-500' },
    { key: 'pengaduan', icon: MessageSquareWarning, warna: 'bg-rose-500/10 text-rose-600' },
    { key: 'penilaian', icon: Star, warna: 'bg-amber-500/10 text-amber-500' },
    { key: 'keamanan', icon: ShieldCheck, warna: 'bg-navy-950/10 text-navy-950' },
    { key: 'pestaKoja', icon: Link2, warna: 'bg-emerald-600/10 text-emerald-600' },
] as const;

export default async function LandingPageRoute({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <LandingPage />;
}

function LandingPage() {
    const t = useTranslations('landing');
    const tNav = useTranslations('nav');

    return (
        <div className="min-h-screen bg-paper-50">
            {/* ── Header ── */}
            <header className="sticky top-0 z-30 bg-paper-50/80 backdrop-blur-md border-b border-paper-200">
                <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo/logo-bps.webp" alt="Logo BPS" className="w-7 h-auto shrink-0" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo/logo-pst-icon.svg" alt="Logo Pelayanan Statistik Terpadu" className="w-7 h-7 shrink-0" />
                        <span className="font-bold text-navy-950 tracking-tight">{t('brandName')}</span>
                    </div>
                    <nav className="flex items-center gap-1 sm:gap-2">
                        <Link href="/pengaduan" className="hidden sm:inline-block text-sm text-navy-950/60 hover:text-navy-950 px-3 py-2 rounded-lg hover:bg-paper-100 transition-colors">
                            {tNav('pengaduan')}
                        </Link>
                        <Link href="/permintaan-data" className="hidden sm:inline-block text-sm text-navy-950/60 hover:text-navy-950 px-3 py-2 rounded-lg hover:bg-paper-100 transition-colors">
                            {tNav('permintaanData')}
                        </Link>
                        <Link href="/pesta-koja" className="hidden sm:inline-block text-sm text-navy-950/60 hover:text-navy-950 px-3 py-2 rounded-lg hover:bg-paper-100 transition-colors">
                            {tNav('pestaKoja')}
                        </Link>
                        <Link href="/faq" className="hidden sm:inline-block text-sm text-navy-950/60 hover:text-navy-950 px-3 py-2 rounded-lg hover:bg-paper-100 transition-colors">
                            {tNav('faq')}
                        </Link>
                        <div className="mr-1">
                            <LanguageSwitcher />
                        </div>
                        <Link href="/login" className="text-sm bg-navy-700 text-white px-4 py-2 rounded-xl font-medium hover:bg-navy-800 transition-colors">
                            {tNav('loginStaff')}
                        </Link>
                    </nav>
                </div>
            </header>

            {/* ── Hero ── */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/kantor-bps.jpg" alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-navy-950/85 via-navy-950/90 to-navy-950" />
                </div>
                <div className="absolute inset-0 bg-grid-dot opacity-10 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
                <div className="relative max-w-4xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-16 text-center">
                    <div className="animate-fade-in-up inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/90 mb-6">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {t('hero.badge')}
                    </div>
                    <h1 className="animate-fade-in-up text-4xl sm:text-6xl font-bold text-white tracking-tight leading-[1.1]" style={{ animationDelay: '0.1s' }}>
                        {t('hero.title')}
                    </h1>
                    <p className="animate-fade-in-up text-lg sm:text-xl text-white/80 mt-3 font-medium" style={{ animationDelay: '0.15s' }}>
                        {t('hero.subtitle')}
                    </p>
                    <p className="animate-fade-in-up text-sm sm:text-base text-white/60 mt-4 max-w-xl mx-auto leading-relaxed" style={{ animationDelay: '0.2s' }}>
                        {t('hero.description')}
                    </p>
                    <div className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-3 mt-8" style={{ animationDelay: '0.3s' }}>
                        <Link
                            href="/permintaan-data"
                            className="group inline-flex items-center gap-2 bg-white text-navy-950 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-paper-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-card w-full sm:w-auto justify-center"
                        >
                            <FileSearch className="w-4 h-4" />
                            {t('hero.ctaPrimary')}
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                        <Link
                            href="/pesta-koja"
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/30 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/20 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto justify-center"
                        >
                            <Link2 className="w-4 h-4" />
                            {t('hero.ctaSecondary')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Fitur ── */}
            <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl font-bold text-navy-950 tracking-tight">{t('features.title')}</h2>
                    <p className="text-sm sm:text-base text-navy-950/50 mt-2 max-w-lg mx-auto">
                        {t('features.subtitle')}
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FITUR_KEYS.map((f, i) => {
                        const Icon = f.icon;
                        return (
                            <div
                                key={f.key}
                                className="animate-fade-in-up bg-white rounded-2xl border border-paper-200 p-6 shadow-soft hover:shadow-card transition-shadow"
                                style={{ animationDelay: `${0.05 * i}s` }}
                            >
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.warna}`}>
                                    <Icon className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <h3 className="font-semibold text-navy-950 mb-1.5">{t(`features.${f.key}.judul`)}</h3>
                                <p className="text-sm text-navy-950/50 leading-relaxed">{t(`features.${f.key}.deskripsi`)}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── Pesta Koja ── */}
            <section className="bg-gradient-to-br from-emerald-600/5 via-azure-500/5 to-transparent">
                <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <div className="inline-flex items-center gap-1.5 bg-emerald-600/10 text-emerald-600 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-5">
                                <Link2 className="w-3.5 h-3.5" />
                                {t('pestaKojaSection.badge')}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-navy-950 tracking-tight mb-2">{t('pestaKojaSection.title')}</h2>
                            <p className="text-sm font-medium text-navy-950/50 mb-4">{t('pestaKojaSection.subtitle')}</p>
                            <p className="text-navy-950/60 text-sm sm:text-base leading-relaxed mb-4">
                                {t('pestaKojaSection.desc1First')}
                                <strong className="text-navy-950">{t('pestaKojaSection.desc1Bold')}</strong>
                                {t('pestaKojaSection.desc1Rest')}
                            </p>
                            <p className="text-navy-950/60 text-sm sm:text-base leading-relaxed mb-6">
                                {t('pestaKojaSection.desc2')}
                            </p>
                            <Link
                                href="/pesta-koja"
                                className="inline-flex items-center gap-2 bg-navy-700 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-navy-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-card"
                            >
                                <Link2 className="w-4 h-4" />
                                {t('pestaKojaSection.cta')}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {(['pandawa', 'perpustakaan', 'silastik', 'ppid'] as const).map((k) => (
                                <div key={k} className="bg-white rounded-2xl border border-paper-200 p-5 shadow-soft">
                                    <div className="font-semibold text-navy-950 text-sm mb-1">{t(`pestaKojaSection.services.${k}.title`)}</div>
                                    <div className="text-navy-950/50 text-xs leading-relaxed">{t(`pestaKojaSection.services.${k}.desc`)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Profil BPS Kota Jambi ── */}
            <section className="bg-navy-950 text-white">
                <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/70 mb-5">
                                <Building2 className="w-3.5 h-3.5" />
                                {t('profile.badge')}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{t('profile.title')}</h2>
                            <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-4">{t('profile.desc1')}</p>
                            <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-6">{t('profile.desc2')}</p>
                            <div className="space-y-2.5 text-sm">
                                <div className="flex items-start gap-2.5 text-white/70">
                                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                                    <span>{t('profile.address')}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-white/70">
                                    <Phone className="w-4 h-4 shrink-0 text-amber-400" />
                                    <span>{t('profile.phone')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <Clock3 className="w-6 h-6 text-amber-400 mb-3" />
                                <div className="font-semibold text-sm mb-1">{t('profile.stats.responsif.title')}</div>
                                <div className="text-white/50 text-xs leading-relaxed">{t('profile.stats.responsif.desc')}</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
                                <div className="font-semibold text-sm mb-1">{t('profile.stats.resmi.title')}</div>
                                <div className="text-white/50 text-xs leading-relaxed">{t('profile.stats.resmi.desc')}</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <FileSearch className="w-6 h-6 text-azure-400 mb-3" />
                                <div className="font-semibold text-sm mb-1">{t('profile.stats.akses.title')}</div>
                                <div className="text-white/50 text-xs leading-relaxed">{t('profile.stats.akses.desc')}</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <Star className="w-6 h-6 text-amber-400 mb-3" />
                                <div className="font-semibold text-sm mb-1">{t('profile.stats.mutu.title')}</div>
                                <div className="text-white/50 text-xs leading-relaxed">{t('profile.stats.mutu.desc')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA Penutup ── */}
            <section className="max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-20 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-navy-950 tracking-tight mb-3">{t('ctaClosing.title')}</h2>
                <p className="text-navy-950/50 text-sm sm:text-base mb-8 max-w-md mx-auto">
                    {t('ctaClosing.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/pesta-koja"
                        className="inline-flex items-center gap-2 bg-navy-700 text-white px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-navy-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-card w-full sm:w-auto justify-center"
                    >
                        <Link2 className="w-4 h-4" />
                        {t('ctaClosing.cta1')}
                    </Link>
                    <Link
                        href="/pengaduan"
                        className="inline-flex items-center gap-2 bg-white text-navy-950 border border-paper-200 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-paper-100 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto justify-center"
                    >
                        <MessageSquareWarning className="w-4 h-4" />
                        {t('ctaClosing.cta2')}
                    </Link>
                </div>
            </section>

            {/* ── Footer ── */}
            <PublicFooter />
        </div>
    );
}

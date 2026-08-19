import Link from 'next/link';
import { PublicFooter } from '@/components/layouts/PublicFooter';
import {
    MessageSquareWarning, FileSearch, Star, Ticket,
    ArrowRight, Building2, ShieldCheck, Clock3, Sparkles, MapPin, Phone, Link2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const FITUR = [
    {
        icon: Ticket,
        judul: 'Antrian Digital',
        deskripsi: 'Pengunjung yang datang langsung ke kantor mengambil nomor antrian lewat layar yang tersedia di ruang pelayanan — cepat, tertib, tanpa kertas.',
        warna: 'bg-navy-700/10 text-navy-700',
    },
    {
        icon: FileSearch,
        judul: 'Permintaan Data Online',
        deskripsi: 'Ajukan permintaan atau konsultasi data dari mana saja. Dapat link unik untuk berkomunikasi langsung dengan petugas sampai selesai.',
        warna: 'bg-azure-500/10 text-azure-500',
    },
    {
        icon: MessageSquareWarning,
        judul: 'Pengaduan Anonim',
        deskripsi: 'Sampaikan keluhan atau masukan tanpa perlu mencantumkan identitas — kami tetap mendengarkan.',
        warna: 'bg-rose-500/10 text-rose-600',
    },
    {
        icon: Star,
        judul: 'Penilaian Pelayanan',
        deskripsi: 'Beri rating dan komentar setelah dilayani, jadi masukan langsung untuk peningkatan kualitas layanan kami.',
        warna: 'bg-amber-500/10 text-amber-500',
    },
    {
        icon: ShieldCheck,
        judul: 'Data Anda Terlindungi',
        deskripsi: 'Setiap permintaan dan pengaduan diproses dengan kendali akses yang ketat — hanya petugas berwenang yang bisa menanganinya.',
        warna: 'bg-navy-950/10 text-navy-950',
    },
    {
        icon: Link2,
        judul: 'Pesta Koja',
        deskripsi: 'Pusat akses cepat ke seluruh layanan digital BPS Kota Jambi — konsultasi WhatsApp, publikasi, rekomendasi statistik, dan lainnya dalam satu tempat.',
        warna: 'bg-emerald-600/10 text-emerald-600',
    },
];

export default function LandingPage() {
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
                        <span className="font-bold text-navy-950 tracking-tight">Simpatik</span>
                    </div>
                    <nav className="flex items-center gap-1 sm:gap-2">
                        <Link href="/pengaduan" className="hidden sm:inline-block text-sm text-navy-950/60 hover:text-navy-950 px-3 py-2 rounded-lg hover:bg-paper-100 transition-colors">
                            Pengaduan
                        </Link>
                        <Link href="/permintaan-data" className="hidden sm:inline-block text-sm text-navy-950/60 hover:text-navy-950 px-3 py-2 rounded-lg hover:bg-paper-100 transition-colors">
                            Permintaan Data
                        </Link>
                        <Link href="/pesta-koja" className="hidden sm:inline-block text-sm text-navy-950/60 hover:text-navy-950 px-3 py-2 rounded-lg hover:bg-paper-100 transition-colors">
                            Pesta Koja
                        </Link>
                        <Link href="/login" className="text-sm bg-navy-700 text-white px-4 py-2 rounded-xl font-medium hover:bg-navy-800 transition-colors">
                            Masuk Sebagai Petugas
                        </Link>
                    </nav>
                </div>
            </header>

            {/* ── Hero ── */}
            <section className="relative overflow-hidden">
                {/* Foto kantor BPS Kota Jambi sebagai latar, dengan overlay
                    gradasi gelap supaya teks putih di atasnya tetap terbaca
                    jelas terlepas dari bagian foto yang tumpang tindih. */}
                <div className="absolute inset-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/kantor-bps.jpg" alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-navy-950/85 via-navy-950/90 to-navy-950" />
                </div>
                <div className="absolute inset-0 bg-grid-dot opacity-10 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
                <div className="relative max-w-4xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-16 text-center">
                    <div className="animate-fade-in-up inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/90 mb-6">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Layanan Digital BPS Kota Jambi
                    </div>
                    <h1 className="animate-fade-in-up text-4xl sm:text-6xl font-bold text-white tracking-tight leading-[1.1]" style={{ animationDelay: '0.1s' }}>
                        Simpatik
                    </h1>
                    <p className="animate-fade-in-up text-lg sm:text-xl text-white/80 mt-3 font-medium" style={{ animationDelay: '0.15s' }}>
                        Sistem Informasi Pelayanan Statistik Terpadu
                    </p>
                    <p className="animate-fade-in-up text-sm sm:text-base text-white/60 mt-4 max-w-xl mx-auto leading-relaxed" style={{ animationDelay: '0.2s' }}>
                        Mempermudah masyarakat mengakses layanan statistik BPS Kota Jambi — dari
                        permintaan data, konsultasi, hingga pengaduan — semua dalam satu tempat.
                    </p>
                    <div className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-3 mt-8" style={{ animationDelay: '0.3s' }}>
                        <Link
                            href="/permintaan-data"
                            className="group inline-flex items-center gap-2 bg-white text-navy-950 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-paper-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-card w-full sm:w-auto justify-center"
                        >
                            <FileSearch className="w-4 h-4" />
                            Buat Konsultasi/Permintaan Data
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                        <Link
                            href="/pesta-koja"
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/30 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/20 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto justify-center"
                        >
                            <Link2 className="w-4 h-4" />
                            Lihat Pesta Koja
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Fitur ── */}
            <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl font-bold text-navy-950 tracking-tight">Semua Layanan, Satu Aplikasi</h2>
                    <p className="text-sm sm:text-base text-navy-950/50 mt-2 max-w-lg mx-auto">
                        Simpatik dirancang untuk membuat interaksi Anda dengan BPS Kota Jambi lebih mudah dan transparan.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FITUR.map((f, i) => {
                        const Icon = f.icon;
                        return (
                            <div
                                key={f.judul}
                                className="animate-fade-in-up bg-white rounded-2xl border border-paper-200 p-6 shadow-soft hover:shadow-card transition-shadow"
                                style={{ animationDelay: `${0.05 * i}s` }}
                            >
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.warna}`}>
                                    <Icon className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <h3 className="font-semibold text-navy-950 mb-1.5">{f.judul}</h3>
                                <p className="text-sm text-navy-950/50 leading-relaxed">{f.deskripsi}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── Profil BPS Kota Jambi ── */}
            <section className="bg-navy-950 text-white">
                <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/70 mb-5">
                                <Building2 className="w-3.5 h-3.5" />
                                Tentang Kami
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Badan Pusat Statistik Kota Jambi</h2>
                            <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-4">
                                BPS Kota Jambi adalah instansi vertikal Badan Pusat Statistik yang bertugas
                                menyediakan data statistik berkualitas untuk perencanaan pembangunan di
                                Kota Jambi — mulai dari sensus dan survei, publikasi statistik sektoral,
                                hingga layanan konsultasi data bagi masyarakat, akademisi, dan instansi
                                pemerintah.
                            </p>
                            <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-6">
                                Lewat Simpatik, kami ingin memastikan setiap masyarakat yang membutuhkan
                                data maupun layanan statistik bisa terlayani dengan cepat, transparan, dan
                                mudah dijangkau — baik datang langsung ke kantor maupun secara daring.
                            </p>
                            <div className="space-y-2.5 text-sm">
                                <div className="flex items-start gap-2.5 text-white/70">
                                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                                    <span>Jl. Jend. Basuki Rahmat, Kota Baru, Kota Jambi, Jambi 38128</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-white/70">
                                    <Phone className="w-4 h-4 shrink-0 text-amber-400" />
                                    <span>(0741) 40539</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <Clock3 className="w-6 h-6 text-amber-400 mb-3" />
                                <div className="font-semibold text-sm mb-1">Layanan Responsif</div>
                                <div className="text-white/50 text-xs leading-relaxed">Permintaan data & pengaduan ditindaklanjuti langsung oleh petugas kami.</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
                                <div className="font-semibold text-sm mb-1">Data Resmi</div>
                                <div className="text-white/50 text-xs leading-relaxed">Bersumber langsung dari BPS, instansi resmi statistik pemerintah Indonesia.</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <FileSearch className="w-6 h-6 text-azure-400 mb-3" />
                                <div className="font-semibold text-sm mb-1">Mudah Diakses</div>
                                <div className="text-white/50 text-xs leading-relaxed">Layanan bisa diajukan kapan saja, dari perangkat apa saja.</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <Star className="w-6 h-6 text-amber-400 mb-3" />
                                <div className="font-semibold text-sm mb-1">Berorientasi Mutu</div>
                                <div className="text-white/50 text-xs leading-relaxed">Setiap layanan dinilai pengunjung untuk perbaikan berkelanjutan.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA Penutup ── */}
            <section className="max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-20 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-navy-950 tracking-tight mb-3">Butuh Bantuan Kami?</h2>
                <p className="text-navy-950/50 text-sm sm:text-base mb-8 max-w-md mx-auto">
                    Jelajahi seluruh layanan digital kami di Pesta Koja, atau sampaikan pengaduan Anda kapan saja.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/pesta-koja"
                        className="inline-flex items-center gap-2 bg-navy-700 text-white px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-navy-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-card w-full sm:w-auto justify-center"
                    >
                        <Link2 className="w-4 h-4" />
                        Lihat Pesta Koja
                    </Link>
                    <Link
                        href="/pengaduan"
                        className="inline-flex items-center gap-2 bg-white text-navy-950 border border-paper-200 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-paper-100 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto justify-center"
                    >
                        <MessageSquareWarning className="w-4 h-4" />
                        Kirim Pengaduan
                    </Link>
                </div>
            </section>

            {/* ── Footer ── */}
            <PublicFooter />
        </div>
    );
}

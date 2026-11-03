import { PublicHeader } from '@/components/layouts/PublicHeader';
import { PublicFooter } from '@/components/layouts/PublicFooter';

export default async function PublikLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    return (
        <div className="min-h-screen flex flex-col bg-paper-50 lg:bg-paper-100">
            {/* Aksesibilitas: pengguna keyboard/pembaca layar bisa melompati header (muncul saat Tab ditekan) */}
            <a
                href="#konten-utama"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-navy-700 focus:text-white focus:px-4 focus:py-2.5 focus:rounded-lg focus:text-sm focus:font-semibold"
            >
                {locale === 'en' ? 'Skip to main content' : 'Lewati ke konten utama'}
            </a>
            <PublicHeader />
            {/* Layar lebar (lg+): konten tampil sebagai satu kartu persegi di tengah, bukan kolom
                sempit yang membuat sisi kiri-kanan halaman kosong. HP/tablet tetap seperti biasa. */}
            <main id="konten-utama" tabIndex={-1} className="flex-1 w-full px-5 py-8 lg:py-12 focus:outline-none">
                <div className="max-w-2xl mx-auto lg:max-w-3xl lg:bg-white lg:rounded-3xl lg:border lg:border-paper-200 lg:shadow-card lg:p-12">
                    {children}
                </div>
            </main>
            <PublicFooter />
        </div>
    );
}

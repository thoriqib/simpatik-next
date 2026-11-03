import { createClient } from '@/lib/supabase/server';
import { getPestaKojaIcon } from '@/lib/pesta-koja-icons';
import { buatQrCodeDataUri } from '@/lib/qrcode';
import { ExternalLink, Sparkles } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { PestaKojaLink } from '@/lib/types/database';

// [OPTIMASI PERFORMA] ISR 60 detik, bukan force-dynamic — daftar link
// dikelola admin dan jarang berubah, dan setiap aksi admin (tambah/edit/
// hapus/urutkan link) sudah memanggil revalidatePath ke halaman ini,
// jadi perubahan tetap langsung terlihat tanpa perlu menunggu jendela
// 60 detik.
export const revalidate = 60;

export default async function PestaKojaPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations('pestaKoja');
    const supabase = await createClient();
    const { data: linkList } = await supabase
        .from('pesta_koja_link')
        .select('*')
        .eq('is_aktif', true)
        .order('urutan');

    // Kartu "Pengaduan & Whistleblowing System" sengaja tidak ditampilkan di Pesta Koja
    // (disaring di sini juga, supaya langsung hilang walau baris di database belum dihapus).
    const links = ((linkList ?? []) as PestaKojaLink[]).filter(
        (l) => !/pengaduan\s*&\s*whistleblowing/i.test(l.judul),
    );

    // [FITUR BARU] QR code menuju halaman ini sendiri — untuk materi cetak
    // (poster/banner di ruang pelayanan), supaya pengunjung bisa langsung
    // buka Pesta Koja di ponsel mereka tanpa perlu ketik URL manual.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const qrCode = await buatQrCodeDataUri(`${appUrl}/pesta-koja`);

    return (
        <>
            <div className="text-center mb-7">
                <div className="inline-flex items-center gap-1.5 bg-azure-500/10 text-azure-500 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('badge')}
                </div>
                <h1 className="text-2xl font-bold text-navy-950 tracking-tight">{t('title')}</h1>
                <p className="text-sm text-navy-950/50 mt-1">{t('subtitle')}</p>
                <p className="text-xs text-navy-950/40 mt-2 max-w-sm mx-auto">
                    {t('description')}
                </p>
            </div>

            {/* [KETERBATASAN DISENGAJA] link.judul & link.deskripsi berasal
                dari database (dikelola admin lewat panel), BUKAN teks statis
                — jadi TETAP dalam bahasa aslinya (biasanya Indonesia) apa
                pun locale yang aktif. Menerjemahkan ini butuh skema
                multi-bahasa terpisah di database, di luar scope saat ini. */}
            {/* HP/tablet: daftar satu kolom (baris). Layar lebar (lg+): grid kartu persegi
                (rasio 1:1) empat kolom supaya halaman tidak terlalu kosong. Kartu QR ikut
                menjadi satu kotak di grid. */}
            <div className="grid gap-3 lg:grid-cols-4 lg:gap-5">
                {links.length > 0 ? links.map((link) => {
                    const Icon = getPestaKojaIcon(link.ikon);
                    return (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex items-center gap-3.5 bg-white border border-paper-200 rounded-2xl px-4 py-3.5 shadow-soft hover:shadow-card hover:border-azure-500/30 transition-all hover:-translate-y-0.5 lg:aspect-square lg:flex-col lg:items-start lg:justify-start lg:gap-3 lg:p-5"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-azure-500 to-navy-700 flex items-center justify-center shrink-0 text-white lg:w-12 lg:h-12">
                                <Icon className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0 lg:flex-none lg:w-full">
                                <div className="font-semibold text-navy-950 text-sm leading-tight lg:text-[15px]">{link.judul}</div>
                                <div className="text-xs text-navy-950/50 mt-0.5 leading-snug lg:mt-1.5 lg:line-clamp-4">{link.deskripsi}</div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-navy-950/20 group-hover:text-azure-500 transition-colors shrink-0 lg:absolute lg:top-4 lg:right-4" />
                        </a>
                    );
                }) : (
                    <div className="text-center py-10 text-navy-950/30 text-sm lg:col-span-4">{t('empty')}</div>
                )}

                <div className="mt-3 lg:mt-0 bg-white border border-paper-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center lg:aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCode} alt="Kode QR Pesta Koja" className="w-32 h-32" />
                    <p className="text-xs font-medium text-navy-950 mt-3">{t('scanCaption')}</p>
                    <p className="text-[11px] text-navy-950/40 mt-0.5">{t('scanHint')}</p>
                </div>
            </div>

            <p className="text-xs text-navy-950/30 text-center mt-8">
                {t('footerNote')}
            </p>
        </>
    );
}

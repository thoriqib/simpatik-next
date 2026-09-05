import { createClient } from '@/lib/supabase/server';
import { getPestaKojaIcon } from '@/lib/pesta-koja-icons';
import { buatQrCodeDataUri } from '@/lib/qrcode';
import { ExternalLink, Sparkles } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import type { PestaKojaLink } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function PestaKojaPage() {
    noStore();

    const supabase = await createClient();
    const { data: linkList } = await supabase
        .from('pesta_koja_link')
        .select('*')
        .eq('is_aktif', true)
        .order('urutan');

    const links = (linkList ?? []) as PestaKojaLink[];

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
                    Pusat Layanan Digital
                </div>
                <h1 className="text-2xl font-bold text-navy-950 tracking-tight">PESTA KOJA</h1>
                <p className="text-sm text-navy-950/50 mt-1">Pelayanan Statistik Kota Jambi</p>
                <p className="text-xs text-navy-950/40 mt-2 max-w-sm mx-auto">
                    Kumpulan akses cepat ke seluruh layanan digital BPS Kota Jambi — dari konsultasi, publikasi, hingga pengaduan.
                </p>
            </div>

            <div className="space-y-3">
                {links.length > 0 ? links.map((link) => {
                    const Icon = getPestaKojaIcon(link.ikon);
                    return (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3.5 bg-white border border-paper-200 rounded-2xl px-4 py-3.5 shadow-soft hover:shadow-card hover:border-azure-500/30 transition-all hover:-translate-y-0.5"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-azure-500 to-navy-700 flex items-center justify-center shrink-0 text-white">
                                <Icon className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-navy-950 text-sm leading-tight">{link.judul}</div>
                                <div className="text-xs text-navy-950/50 mt-0.5 leading-snug">{link.deskripsi}</div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-navy-950/20 group-hover:text-azure-500 transition-colors shrink-0" />
                        </a>
                    );
                }) : (
                    <div className="text-center py-10 text-navy-950/30 text-sm">Belum ada link layanan yang tersedia.</div>
                )}
            </div>

            <div className="mt-6 bg-white border border-paper-200 rounded-2xl p-5 flex flex-col items-center text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="Kode QR Pesta Koja" className="w-32 h-32" />
                <p className="text-xs font-medium text-navy-950 mt-3">Pindai untuk buka Pesta Koja</p>
                <p className="text-[11px] text-navy-950/40 mt-0.5">Cocok dicetak untuk poster/banner di ruang pelayanan</p>
            </div>

            <p className="text-xs text-navy-950/30 text-center mt-8">
                Setiap link membuka laman resmi BPS terkait di tab baru.
            </p>
        </>
    );
}

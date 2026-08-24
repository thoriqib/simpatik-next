import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { ChatThreadPengaduan } from '@/components/pengaduan/ChatThreadPengaduan';
import { LinkLacakPengaduanCard } from './LinkLacakPengaduanCard';
import { ambilJamPelayanan } from '@/lib/jam-pelayanan';
import { unstable_noStore as noStore } from 'next/cache';
import type { Pengaduan, PengaduanPesan } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function DetailPengaduanPage({ params }: { params: Promise<{ id: string }> }) {
    noStore();

    const { id } = await params;
    const supabase = await createClient();

    const { data: pengaduanRaw } = await supabase.from('pengaduan').select('*').eq('id', id).single();
    const pengaduan = pengaduanRaw as Pengaduan | null;
    if (!pengaduan) notFound();

    let lampiranUrl: string | null = null;
    if (pengaduan.lampiran_path) {
        const { data } = supabase.storage.from('pengaduan').getPublicUrl(pengaduan.lampiran_path);
        lampiranUrl = data.publicUrl;
    }

    const { data: pesanRaw } = await supabase
        .from('pengaduan_pesan')
        .select('*')
        .eq('pengaduan_id', pengaduan.id)
        .order('created_at');
    const pesan = (pesanRaw ?? []) as PengaduanPesan[];

    const { jamMulai, jamSelesai } = await ambilJamPelayanan();

    return (
        <>
            <div className="flex items-center gap-2 text-sm text-navy-950/50 mb-5">
                <Link href="/admin/pengaduan" className="hover:text-azure-500">Pengaduan</Link>
                <span>/</span>
                <span className="text-navy-950 font-medium">{pengaduan.subjek.slice(0, 40)}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                    <Card title="Isi Pengaduan">
                        <h3 className="text-base font-semibold text-navy-950 mb-3">{pengaduan.subjek}</h3>
                        <p className="text-sm text-navy-950/80 leading-relaxed whitespace-pre-line">{pengaduan.isi_pengaduan}</p>
                        {lampiranUrl && (
                            <div className="mt-4 pt-4 border-t border-paper-200">
                                <a href={lampiranUrl} target="_blank" rel="noopener noreferrer" className="text-azure-500 hover:underline text-sm">Lihat Lampiran</a>
                            </div>
                        )}
                    </Card>

                    <Card title="Percakapan" description="Bersifat anonim — pengadu tidak pernah tercatat identitasnya. Balasan pertama Anda otomatis membuka percakapan.">
                        <div className="mb-4 pb-4 border-b border-paper-200">
                            <LinkLacakPengaduanCard token={pengaduan.token} />
                        </div>
                        <ChatThreadPengaduan
                            pengaduanId={pengaduan.id}
                            pesanAwal={pesan}
                            status={pengaduan.status}
                            jamMulai={jamMulai}
                            jamSelesai={jamSelesai}
                        />
                    </Card>
                </div>

                <div className="space-y-5">
                    <Card title="Informasi">
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-navy-950/50 text-xs uppercase tracking-wider mb-1">Status</dt>
                                <dd><Badge status={pengaduan.status} /></dd>
                            </div>
                            <div>
                                <dt className="text-navy-950/50 text-xs uppercase tracking-wider mb-1">Tanggal Masuk</dt>
                                <dd className="text-navy-950 font-medium">{new Date(pengaduan.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
                            </div>
                        </dl>
                    </Card>
                    <Link href="/admin/pengaduan" className="block text-center bg-paper-100 text-navy-950/80 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-paper-200 transition">← Kembali ke Daftar</Link>
                </div>
            </div>
        </>
    );
}

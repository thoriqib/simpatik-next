import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { ChatThread } from '@/components/permintaan-data/ChatThread';
import { KlaimAction } from './KlaimAction';
import { unstable_noStore as noStore } from 'next/cache';
import type { PermintaanData, PermintaanDataPesan } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

const KEGUNAAN_LABEL: Record<string, string> = {
    kedinasan: 'Kedinasan/Pekerjaan',
    pribadi: 'Pribadi/Tugas Sekolah/Kuliah/Skripsi',
};

export default async function DetailPermintaanDataPetugasPage({ params }: { params: Promise<{ id: string }> }) {
    // [FIX BUG] Lihat catatan lengkap di app/petugas/dashboard/page.tsx —
    // halaman ini bergantung pada reload setelah klaim/ambil-alih/kirim
    // pesan/selesaikan, jadi rawan kena bug caching yang sama.
    noStore();

    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // [FIX] Cast eksplisit — relasi to-one `profiles` ditebak sebagai array
    // tanpa generated types.
    const { data: permintaanRaw } = await supabase.from('permintaan_data').select('*, profiles(name)').eq('id', id).single();
    const permintaan = permintaanRaw as unknown as PermintaanData | null;
    if (!permintaan) notFound();

    const punyaKu = permintaan.ditangani_oleh === user?.id;

    const { data: pesanRaw } = await supabase
        .from('permintaan_data_pesan')
        .select('*')
        .eq('permintaan_data_id', permintaan.id)
        .order('created_at');
    const pesan = (pesanRaw ?? []) as PermintaanDataPesan[];

    return (
        <>
            <div className="flex items-center gap-2 text-sm text-navy-950/50 mb-5">
                <Link href="/petugas/permintaan-data" className="hover:text-azure-500">Permintaan Data</Link>
                <span>/</span>
                <span className="text-navy-950 font-medium">{permintaan.nama_lengkap}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                    <Card title="Detail Permintaan">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-5">
                            <div>
                                <dt className="text-navy-950/40 text-xs uppercase tracking-wide mb-1">Nama Lengkap</dt>
                                <dd className="text-navy-950 font-medium">{permintaan.nama_lengkap}</dd>
                            </div>
                            <div>
                                <dt className="text-navy-950/40 text-xs uppercase tracking-wide mb-1">Instansi</dt>
                                <dd className="text-navy-950 font-medium">{permintaan.instansi}</dd>
                            </div>
                            <div>
                                <dt className="text-navy-950/40 text-xs uppercase tracking-wide mb-1">Kegunaan Data</dt>
                                <dd className="text-navy-950">{KEGUNAAN_LABEL[permintaan.kegunaan_data] ?? permintaan.kegunaan_data}</dd>
                            </div>
                            <div>
                                <dt className="text-navy-950/40 text-xs uppercase tracking-wide mb-1">Kontak</dt>
                                <dd className="text-navy-950">
                                    <a href={`mailto:${permintaan.email}`} className="text-azure-500 hover:underline">{permintaan.email}</a>
                                    <span className="text-navy-950/30 mx-1.5">·</span>
                                    <a href={`tel:${permintaan.no_hp}`} className="text-azure-500 hover:underline">{permintaan.no_hp}</a>
                                </dd>
                            </div>
                        </dl>
                        <div className="pt-4 border-t border-paper-200">
                            <dt className="text-navy-950/40 text-xs uppercase tracking-wide mb-1.5">Data/Konsultasi yang Dibutuhkan</dt>
                            <dd className="text-sm text-navy-950 leading-relaxed whitespace-pre-line">{permintaan.kebutuhan_data}</dd>
                        </div>
                    </Card>

                    {permintaan.status === 'baru' ? (
                        <Card title="Belum Ada yang Menangani">
                            <p className="text-sm text-navy-950/60 mb-4">
                                Permintaan ini masih baru dan belum ditindaklanjuti siapa pun. Klik tombol
                                di bawah untuk menindaklanjuti.
                            </p>
                            <KlaimAction id={permintaan.id} mode="klaim" />
                        </Card>
                    ) : !punyaKu && permintaan.status === 'diproses' ? (
                        <Card title="Sedang Ditangani Petugas Lain">
                            <p className="text-sm text-navy-950/60 mb-4">
                                Permintaan ini sedang ditangani oleh <strong className="text-navy-950">{permintaan.profiles?.name}</strong>.
                                Kalau petugas tersebut berhalangan, Anda bisa mengambil alih.
                            </p>
                            <KlaimAction id={permintaan.id} mode="ambil-alih" />
                        </Card>
                    ) : (
                        <Card
                            title="Percakapan"
                            description={
                                permintaan.status === 'selesai'
                                    ? 'Percakapan sudah ditutup (status selesai).'
                                    : 'Permintaan ini jadi tanggung jawab Anda. Kalau berhasil diselesaikan, akan tercatat sebagai pengunjung yang Anda layani.'
                            }
                        >
                            <ChatThread
                                permintaanId={permintaan.id}
                                pesanAwal={pesan}
                                namaPengunjung={permintaan.nama_lengkap}
                                bisaKirim={punyaKu && permintaan.status === 'diproses'}
                                bisaSelesaikan={punyaKu && permintaan.status === 'diproses'}
                            />
                        </Card>
                    )}
                </div>

                <div className="space-y-5">
                    <Card title="Status">
                        <Badge status={permintaan.status} />
                        <p className="text-xs text-navy-950/40 mt-3">
                            Masuk pada {new Date(permintaan.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
                        </p>
                        {permintaan.profiles?.name && permintaan.status !== 'baru' && (
                            <p className="text-xs text-navy-950/60 mt-2 pt-2 border-t border-paper-200">
                                Penanggung jawab: <strong className="text-navy-950">{permintaan.profiles.name}</strong>
                                {punyaKu && <span className="text-azure-500"> (Saya)</span>}
                            </p>
                        )}
                    </Card>
                    <Link href="/petugas/permintaan-data" className="block text-center bg-paper-100 text-navy-950 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-paper-200 transition-colors">← Kembali ke Daftar</Link>
                </div>
            </div>
        </>
    );
}

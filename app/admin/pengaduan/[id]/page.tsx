import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { TanggapiForm } from './TanggapiForm';
import type { Pengaduan } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function DetailPengaduanPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // [FIX] Cast eksplisit — tanpa generated types, Supabase menebak
    // relasi to-one `profiles` sebagai array, padahal runtime-nya objek.
    const { data: pengaduanRaw } = await supabase.from('pengaduan').select('*, profiles(name)').eq('id', id).single();
    const pengaduan = pengaduanRaw as unknown as Pengaduan | null;
    if (!pengaduan) notFound();

    let lampiranUrl: string | null = null;
    if (pengaduan.lampiran_path) {
        const { data } = supabase.storage.from('pengaduan').getPublicUrl(pengaduan.lampiran_path);
        lampiranUrl = data.publicUrl;
    }

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

                    {pengaduan.status === 'selesai' ? (
                        <Card title="Tanggapan Admin">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <p className="text-sm text-navy-950/80 leading-relaxed">{pengaduan.tanggapan}</p>
                            </div>
                            <p className="text-xs text-navy-950/30 mt-3">
                                Ditanggapi oleh <strong>{pengaduan.profiles?.name}</strong> pada {pengaduan.ditanggapi_pada && new Date(pengaduan.ditanggapi_pada).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </Card>
                    ) : (
                        <Card title="Berikan Tanggapan">
                            <TanggapiForm id={pengaduan.id} currentStatus={pengaduan.status} />
                        </Card>
                    )}
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

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { TanggapiForm } from './TanggapiForm';
import type { PermintaanData } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

const KEGUNAAN_LABEL: Record<string, string> = {
    kedinasan: 'Kedinasan/Pekerjaan',
    pribadi: 'Pribadi/Tugas Sekolah/Kuliah/Skripsi',
};

export default async function DetailPermintaanDataPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // [FIX] Cast eksplisit — relasi to-one `profiles` ditebak sebagai array
    // tanpa generated types.
    const { data: permintaanRaw } = await supabase.from('permintaan_data').select('*, profiles(name)').eq('id', id).single();
    const permintaan = permintaanRaw as unknown as PermintaanData | null;
    if (!permintaan) notFound();

    return (
        <>
            <div className="flex items-center gap-2 text-sm text-navy-950/50 mb-5">
                <Link href="/admin/permintaan-data" className="hover:text-azure-500">Permintaan Data</Link>
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

                    {permintaan.status === 'selesai' ? (
                        <Card title="Tanggapan">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                <p className="text-sm text-navy-950 leading-relaxed whitespace-pre-line">{permintaan.tanggapan}</p>
                            </div>
                            <p className="text-xs text-navy-950/40 mt-3">
                                Ditanggapi oleh <strong>{permintaan.profiles?.name}</strong> pada {permintaan.ditanggapi_pada && new Date(permintaan.ditanggapi_pada).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </Card>
                    ) : (
                        <Card title="Tindak Lanjuti Permintaan">
                            <TanggapiForm id={permintaan.id} currentStatus={permintaan.status} />
                        </Card>
                    )}
                </div>

                <div className="space-y-5">
                    <Card title="Status">
                        <Badge status={permintaan.status} />
                        <p className="text-xs text-navy-950/40 mt-3">
                            Masuk pada {new Date(permintaan.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
                        </p>
                    </Card>
                    <Link href="/admin/permintaan-data" className="block text-center bg-paper-100 text-navy-950 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-paper-200 transition-colors">← Kembali ke Daftar</Link>
                </div>
            </div>
        </>
    );
}

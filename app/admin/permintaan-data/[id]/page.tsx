import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { TanggapiForm } from './TanggapiForm';
import { DelegasiForm } from './DelegasiForm';
import { AdminAksiLanjutan } from './AdminAksiLanjutan';
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

    const { data: petugasList } = await supabase.from('profiles').select('id, name').eq('role', 'petugas').order('name');

    const belumSelesai = permintaan.status !== 'selesai';

    return (
        <>
            <div className="flex items-center gap-2 text-sm text-navy-950/50 mb-5">
                <Link href="/admin/permintaan-data" className="hover:text-azure-500">Permintaan Data</Link>
                <span>/</span>
                <span className="text-navy-950 font-medium">{permintaan.nama_lengkap}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                    <Card>
                        <div className="flex items-start justify-between mb-5">
                            <h3 className="text-base font-semibold text-navy-950 tracking-tight">Detail Permintaan</h3>
                            <Link
                                href={`/admin/permintaan-data/${permintaan.id}/edit`}
                                className="inline-flex items-center gap-1.5 text-xs font-medium bg-paper-100 text-navy-950 px-3 py-1.5 rounded-lg hover:bg-paper-200 transition-colors shrink-0"
                            >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                            </Link>
                        </div>
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

                    {permintaan.status === 'selesai' && (
                        <Card title="Tanggapan">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                <p className="text-sm text-navy-950 leading-relaxed whitespace-pre-line">{permintaan.tanggapan}</p>
                            </div>
                            <p className="text-xs text-navy-950/40 mt-3">
                                Diselesaikan oleh <strong>{permintaan.profiles?.name}</strong> pada {permintaan.ditanggapi_pada && new Date(permintaan.ditanggapi_pada).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </Card>
                    )}

                    {belumSelesai && (
                        <Card title="Tanggapi Langsung">
                            <TanggapiForm id={permintaan.id} currentStatus={permintaan.status} basePath="/admin/permintaan-data" />
                        </Card>
                    )}

                    {/* [UPDATE] Ganti penanggung jawab kini tersedia KAPAN PUN, tidak
                        cuma saat belum selesai — admin punya kendali penuh atas PJ
                        permintaan, termasuk yang sudah diproses petugas lain. */}
                    {petugasList && petugasList.length > 0 && (
                        <Card title="Ganti/Tetapkan Penanggung Jawab">
                            <DelegasiForm id={permintaan.id} petugasList={petugasList} />
                        </Card>
                    )}

                    <Card title="Kelola Permintaan">
                        <AdminAksiLanjutan id={permintaan.id} status={permintaan.status} />
                    </Card>
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
                            </p>
                        )}
                    </Card>
                    <Link href="/admin/permintaan-data" className="block text-center bg-paper-100 text-navy-950 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-paper-200 transition-colors">← Kembali ke Daftar</Link>
                </div>
            </div>
        </>
    );
}

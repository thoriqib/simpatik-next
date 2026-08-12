import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { PermintaanData } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

const KEGUNAAN_LABEL: Record<string, string> = {
    kedinasan: 'Kedinasan/Pekerjaan',
    pribadi: 'Pribadi/Sekolah/Kuliah',
};

export default async function PermintaanDataListPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    // [FIX BUG] Lihat catatan lengkap di app/petugas/dashboard/page.tsx
    noStore();

    const { status } = await searchParams;
    const supabase = await createClient();

    let query = supabase.from('permintaan_data').select('*, profiles(name)').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    // [FIX] Cast eksplisit — konsisten dengan pola di seluruh proyek untuk
    // menghindari salah tebak tipe relasi Supabase tanpa generated types.
    const { data: permintaanRaw } = await query;
    const permintaan = permintaanRaw as unknown as PermintaanData[] | null;

    const { count: jumlahBaru } = await supabase.from('permintaan_data').select('*', { count: 'exact', head: true }).eq('status', 'baru');
    const { count: jumlahDiproses } = await supabase.from('permintaan_data').select('*', { count: 'exact', head: true }).eq('status', 'diproses');

    const tabs = [
        { key: '', label: 'Semua' },
        { key: 'baru', label: 'Baru', count: jumlahBaru },
        { key: 'diproses', label: 'Diproses', count: jumlahDiproses },
        { key: 'selesai', label: 'Selesai' },
    ];

    return (
        <>
            <div className="mb-4">
                <h1 className="text-lg font-semibold text-navy-950">Permintaan Data Pengunjung</h1>
                <p className="text-sm text-navy-950/50 mt-0.5">Form permintaan/konsultasi data dari pengunjung publik (pengganti Google Form).</p>
            </div>

            <div className="flex gap-2 mb-5 flex-wrap">
                {tabs.map((tab) => (
                    <Link key={tab.key} href={tab.key ? `/admin/permintaan-data?status=${tab.key}` : '/admin/permintaan-data'}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${(status ?? '') === tab.key ? 'bg-navy-700 text-white' : 'bg-white text-navy-950/70 border border-paper-200 hover:bg-paper-50'}`}>
                        {tab.label} {tab.count ? <span className="ml-1 text-xs bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">{tab.count}</span> : null}
                    </Link>
                ))}
            </div>

            <Card>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-navy-950/50 text-left">
                            <th className="pb-3 font-medium">Tgl Masuk</th>
                            <th className="pb-3 font-medium">Nama & Instansi</th>
                            <th className="pb-3 font-medium">Kegunaan</th>
                            <th className="pb-3 font-medium">Kontak</th>
                            <th className="pb-3 font-medium">Ditangani Oleh</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {permintaan && permintaan.length > 0 ? permintaan.map((p) => (
                            <tr key={p.id} className={`hover:bg-paper-50 ${p.status === 'baru' ? 'border-l-4 border-l-rose-400' : ''}`}>
                                <td className="py-3 text-navy-950/50 text-xs whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td className="py-3">
                                    <div className="font-medium text-navy-950">{p.nama_lengkap}</div>
                                    <div className="text-xs text-navy-950/40">{p.instansi}</div>
                                </td>
                                <td className="py-3 text-xs text-navy-950/60">{KEGUNAAN_LABEL[p.kegunaan_data] ?? p.kegunaan_data}</td>
                                <td className="py-3 text-xs text-navy-950/60">
                                    <div>{p.email}</div>
                                    <div>{p.no_hp}</div>
                                </td>
                                <td className="py-3 text-xs text-navy-950/60">{p.profiles?.name ?? <span className="text-navy-950/30 italic">Belum ada</span>}</td>
                                <td className="py-3"><Badge status={p.status} /></td>
                                <td className="py-3">
                                    <Link href={`/admin/permintaan-data/${p.id}`} className="text-xs font-medium bg-azure-500/10 text-azure-500 px-3 py-1.5 rounded-lg hover:bg-azure-500/20 transition-colors">Detail →</Link>
                                </td>
                            </tr>
                        )) : <tr><td colSpan={7} className="py-10 text-center text-navy-950/30">Belum ada permintaan data masuk</td></tr>}
                    </tbody>
                </table>
                </div>
            </Card>
        </>
    );
}

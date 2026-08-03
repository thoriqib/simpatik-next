import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PengaduanListPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { status } = await searchParams;
    const supabase = await createClient();

    let query = supabase.from('pengaduan').select('*, profiles(name)').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data: pengaduan } = await query;

    const { count: jumlahBaru } = await supabase.from('pengaduan').select('*', { count: 'exact', head: true }).eq('status', 'baru');
    const { count: jumlahDiproses } = await supabase.from('pengaduan').select('*', { count: 'exact', head: true }).eq('status', 'diproses');

    const tabs = [
        { key: '', label: 'Semua' },
        { key: 'baru', label: 'Baru', count: jumlahBaru },
        { key: 'diproses', label: 'Diproses', count: jumlahDiproses },
        { key: 'selesai', label: 'Selesai' },
    ];

    return (
        <>
            <h1 className="text-lg font-semibold text-navy-950 mb-4">Daftar Pengaduan</h1>

            <div className="flex gap-2 mb-5 flex-wrap">
                {tabs.map((tab) => (
                    <Link key={tab.key} href={tab.key ? `/admin/pengaduan?status=${tab.key}` : '/admin/pengaduan'}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${(status ?? '') === tab.key ? 'bg-navy-700 text-white' : 'bg-white text-navy-950/60 border hover:bg-paper-50'}`}>
                        {tab.label} {tab.count ? <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{tab.count}</span> : null}
                    </Link>
                ))}
            </div>

            <Card>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-navy-950/50 text-left">
                            <th className="pb-3 font-medium">Tgl Masuk</th><th className="pb-3 font-medium">Subjek</th>
                            <th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Ditangani</th><th className="pb-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {pengaduan && pengaduan.length > 0 ? pengaduan.map((p) => (
                            <tr key={p.id} className={`hover:bg-paper-50 ${p.status === 'baru' ? 'border-l-4 border-l-red-400' : ''}`}>
                                <td className="py-3 text-navy-950/50 text-xs">{new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td className="py-3">
                                    <div className="font-medium text-navy-950">{p.subjek}</div>
                                    <div className="text-xs text-navy-950/30 mt-0.5">{p.isi_pengaduan.slice(0, 60)}</div>
                                </td>
                                <td className="py-3"><Badge status={p.status} /></td>
                                <td className="py-3 text-navy-950/50 text-sm">{p.profiles?.name ?? '—'}</td>
                                <td className="py-3">
                                    <Link href={`/admin/pengaduan/${p.id}`} className="text-xs font-medium bg-azure-500/10 text-navy-700 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition">Detail →</Link>
                                </td>
                            </tr>
                        )) : <tr><td colSpan={5} className="py-10 text-center text-navy-950/30">Tidak ada pengaduan</td></tr>}
                    </tbody>
                </table>
            </Card>
        </>
    );
}
